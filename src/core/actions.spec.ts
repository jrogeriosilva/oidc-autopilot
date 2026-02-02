import { loadIsolatedModule } from "../testUtils/isolateModule";

describe("ActionExecutor", () => {
	const setupActionExecutor = () => {
		const mocks = {
			applyTemplate: jest.fn((value: unknown) => value),
			captureFromObject: jest.fn(),
			navigateWithPlaywright: jest.fn().mockResolvedValue("https://final.example"),
			requestJson: jest
				.fn()
				.mockImplementation(
					async (
						_url: string,
						_init: RequestInit,
						_status: unknown,
						options?: { capture?: { store: Record<string, string> } }
					) => {
						if (options?.capture) {
							options.capture.store.captured = "yes";
						}
						return { ok: true };
					}
				),
			getAuthHeaders: jest.fn((headers?: Record<string, string>) => ({
				"Content-Type": "application/json",
				...(headers ?? {}),
			})),
			HttpClient: jest.fn(),
		};

		const ActionExecutor = loadIsolatedModule(
			() => {
				jest.doMock("./template", () => ({ applyTemplate: mocks.applyTemplate }));
				jest.doMock("./capture", () => ({ captureFromObject: mocks.captureFromObject }));
				jest.doMock("./playwrightRunner", () => ({
					navigateWithPlaywright: mocks.navigateWithPlaywright,
				}));
				jest.doMock("./httpClient", () => ({
					HttpClient: mocks.HttpClient.mockImplementation(() => ({
						requestJson: mocks.requestJson,
						getAuthHeaders: mocks.getAuthHeaders,
					})),
				}));
			},
			() => require("./actions").ActionExecutor
		);

		return { ActionExecutor, mocks };
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns action by name", () => {
		const { ActionExecutor } = setupActionExecutor();
		const actions = [
			{
				name: "act1",
				endpoint: "https://example.com/one",
				method: "POST",
			},
		];

		const executor = new ActionExecutor(actions, { captureVars: [], headless: true });

		expect(executor.getAction("act1")).toEqual(actions[0]);
	});

	it("throws when action is missing", async () => {
		const { ActionExecutor } = setupActionExecutor();
		const executor = new ActionExecutor([], { captureVars: [], headless: true });

		await expect(executor.executeAction("missing", {})).rejects.toThrow(
			"Action 'missing' not found in config"
		);
	});

	it("templates request data, executes HTTP call, and captures callback", async () => {
		const { ActionExecutor, mocks } = setupActionExecutor();

		const rawPayload = { foo: "{{bar}}" };
		const rawHeaders = { "X-Test": "{{token}}" };
		const action = {
			name: "act1",
			endpoint: "https://api.example/{{id}}",
			method: "POST",
			payload: rawPayload,
			headers: rawHeaders,
			callback_to: "https://callback/{{id}}",
		};
		const variables = { id: "123", bar: "baz", token: "tkn" };

		mocks.applyTemplate.mockImplementation((value: unknown) => {
			if (value === action.endpoint) {
				return "https://api.example/123";
			}
			if (value === rawPayload) {
				return { foo: "baz" };
			}
			if (value === rawHeaders) {
				return { "X-Test": "tkn" };
			}
			if (value === action.callback_to) {
				return "https://callback/123";
			}
			return value;
		});

		const executor = new ActionExecutor([action], {
			captureVars: ["captured"],
			headless: true,
		});

		const result = await executor.executeAction("act1", variables);

		expect(mocks.applyTemplate).toHaveBeenCalledWith(action.endpoint, variables);
		expect(mocks.applyTemplate).toHaveBeenCalledWith(rawPayload, variables);
		expect(mocks.applyTemplate).toHaveBeenCalledWith(rawHeaders, variables);
		expect(mocks.applyTemplate).toHaveBeenCalledWith(action.callback_to, variables);

		expect(mocks.getAuthHeaders).toHaveBeenCalledWith({ "X-Test": "tkn" });
		expect(mocks.requestJson).toHaveBeenCalledWith(
			"https://api.example/123",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Test": "tkn",
				},
				body: JSON.stringify({ foo: "baz" }),
			},
			"ok",
			{
				capture: { captureVars: ["captured"], store: result },
				allowNonJson: true,
			}
		);

		expect(mocks.navigateWithPlaywright).toHaveBeenCalledWith(
			"https://callback/123",
			true
		);
		expect(mocks.captureFromObject).toHaveBeenCalledWith(
			"https://final.example",
			["captured"],
			result
		);
		expect(result).toEqual({ captured: "yes" });
	});

	it("executes action without payload, headers, or callback", async () => {
		const { ActionExecutor, mocks } = setupActionExecutor();

		const action = {
			name: "act2",
			endpoint: "https://api.example/health",
			method: "GET",
		};

		const executor = new ActionExecutor([action], {
			captureVars: [],
			headless: true,
		});

		const result = await executor.executeAction("act2", {});

		expect(mocks.applyTemplate).toHaveBeenCalledWith(action.endpoint, {});
		expect(mocks.requestJson).toHaveBeenCalledWith(
			"https://api.example/health",
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				body: undefined,
			},
			"ok",
			{
				capture: { captureVars: [], store: result },
				allowNonJson: true,
			}
		);
		expect(mocks.navigateWithPlaywright).not.toHaveBeenCalled();
		expect(result).toEqual({ captured: "yes" });
	});
});

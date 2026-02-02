import { loadIsolatedModule } from "../testUtils/isolateModule";

describe("ConformanceApi", () => {
	const setup = () => {
		const mockClient = {
			buildUrl: jest.fn(),
			getAuthHeaders: jest.fn(),
			requestJson: jest.fn(),
		};

		const HttpClientMock = jest.fn().mockImplementation(() => mockClient);
		const ConformanceApi = loadIsolatedModule(
			() => {
				jest.doMock("./httpClient", () => ({
					HttpClient: HttpClientMock,
				}));
			},
			() => require("./conformanceApi").ConformanceApi
		);

		return { ConformanceApi, HttpClientMock, mockClient };
	};

	const createApi = (ConformanceApi: any) =>
		new ConformanceApi({ baseUrl: "https://example.com", token: "token" });

	test("registerRunner posts to api/runner with query params", async () => {
		const { ConformanceApi, HttpClientMock, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/runner");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValue({ id: "runner-1" });

		const api = createApi(ConformanceApi);
		const capture = { captureVars: ["id"], store: {} };

		const runnerId = await api.registerRunner("plan-1", "test-1", capture);

		expect(runnerId).toBe("runner-1");
		expect(HttpClientMock).toHaveBeenCalledWith({
			baseUrl: "https://example.com",
			token: "token",
		});
		expect(mockClient.buildUrl).toHaveBeenCalledWith("api/runner");
		expect(mockClient.requestJson).toHaveBeenCalledWith(
			expect.stringContaining("https://example.com/api/runner"),
			{
				method: "POST",
				headers: { Authorization: "Bearer token" },
			},
			[200, 201],
			{ capture }
		);

		const requestUrl = mockClient.requestJson.mock.calls[0][0] as string;
		const parsed = new URL(requestUrl);
		expect(parsed.searchParams.get("plan")).toBe("plan-1");
		expect(parsed.searchParams.get("test")).toBe("test-1");
	});

	test("registerRunner surfaces HTTP errors", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/runner");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockRejectedValue(new Error("HTTP 500: server error"));

		const api = createApi(ConformanceApi);

		await expect(api.registerRunner("plan-1", "test-1")).rejects.toThrow(
			"HTTP 500: server error"
		);
	});

	test("getModuleInfo parses response and applies defaults", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/info/runner-1");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValue({});

		const api = createApi(ConformanceApi);
		const result = await api.getModuleInfo("runner-1");

		expect(result.status).toBe("CREATED");
		expect(result.result).toBe("UNKNOWN");
		expect(mockClient.requestJson).toHaveBeenCalledWith(
			"https://example.com/api/info/runner-1",
			{
				method: "GET",
				headers: { Authorization: "Bearer token" },
			},
			200,
			{ capture: undefined }
		);
	});

	test("getModuleInfo normalizes status and result", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/info/runner-1");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValue({ status: "waiting", result: "passed" });

		const api = createApi(ConformanceApi);
		const result = await api.getModuleInfo("runner-1");

		expect(result.status).toBe("WAITING");
		expect(result.result).toBe("PASSED");
	});

	test("getRunnerInfo returns parsed runner info", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/runner/runner-1");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValue({
			status: "RUNNING",
			browser: { urls: ["https://start"], urlsWithMethod: [{ url: "https://post" }] },
		});

		const api = createApi(ConformanceApi);
		const result = await api.getRunnerInfo("runner-1");

		expect(result.status).toBe("RUNNING");
		expect(result.browser?.urls).toEqual(["https://start"]);
		expect(result.browser?.urlsWithMethod?.[0].url).toBe("https://post");
	});

	test("getRunnerInfo applies browser defaults", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/runner/runner-1");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValue({
			status: "WAITING",
			browser: { urlsWithMethod: [{ url: "https://start" }] },
		});

		const api = createApi(ConformanceApi);
		const result = await api.getRunnerInfo("runner-1");

		expect(result.browser?.urls).toEqual([]);
		expect(result.browser?.urlsWithMethod?.[0].method).toBe("GET");
	});

	test("getModuleLogs returns logs array only when response is array", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/log/runner-1");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValueOnce([{ entry: 1 }]).mockResolvedValueOnce({});

		const api = createApi(ConformanceApi);

		const logs = await api.getModuleLogs("runner-1");
		expect(logs).toEqual([{ entry: 1 }]);

		const empty = await api.getModuleLogs("runner-1");
		expect(empty).toEqual([]);
	});

	test("startModule posts to runner endpoint", async () => {
		const { ConformanceApi, mockClient } = setup();

		mockClient.buildUrl.mockReturnValue("https://example.com/api/runner/runner-1");
		mockClient.getAuthHeaders.mockReturnValue({ Authorization: "Bearer token" });
		mockClient.requestJson.mockResolvedValue({});

		const api = createApi(ConformanceApi);

		await api.startModule("runner-1");

		expect(mockClient.requestJson).toHaveBeenCalledWith(
			"https://example.com/api/runner/runner-1",
			{
				method: "POST",
				headers: { Authorization: "Bearer token" },
			},
			[200, 201],
			{ capture: undefined }
		);
	});
});

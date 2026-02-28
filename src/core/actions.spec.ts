import { loadIsolatedModule } from "../testUtils/isolateModule";

describe("ActionExecutor", () => {
  const setupActionExecutor = () => {
    const browserNavigateMock = jest.fn().mockResolvedValue("https://final.example");

    const mocks = {
      applyTemplate: jest.fn((value: unknown) => value),
      captureFromObject: jest.fn(),
      browserNavigate: browserNavigateMock,
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
      BrowserSession: jest.fn().mockImplementation(() => ({
        navigate: browserNavigateMock,
        close: jest.fn(),
        initialize: jest.fn(),
        isInitialized: jest.fn().mockReturnValue(true),
      })),
    };

    const ActionExecutor = loadIsolatedModule(
      () => {
        jest.doMock("./template", () => ({ applyTemplate: mocks.applyTemplate }));
        jest.doMock("./capture", () => ({ captureFromObject: mocks.captureFromObject }));
        jest.doMock("./browserSession", () => ({
          BrowserSession: mocks.BrowserSession.mockImplementation(() => ({
            navigate: mocks.browserNavigate,
          })),
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

  describe("getAction", () => {
    it("returns action by name", () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);
      const actions = [
        {
          name: "act1",
          type: "api" as const,
          endpoint: "https://example.com/one",
          method: "POST",
        },
      ];

      const executor = new ActionExecutor(actions, {
        captureVars: [],
        headless: true,
        browserSession,
      });

      expect(executor.getAction("act1")).toEqual(actions[0]);
    });
  });

  describe("executeAction", () => {
    it("throws when action is missing", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);
      const executor = new ActionExecutor([], {
        captureVars: [],
        headless: true,
        browserSession,
      });

      await expect(executor.executeAction("missing", {}, {})).rejects.toThrow(
        "Action 'missing' not found in config"
      );
    });
  });

  describe("API actions", () => {
    it("templates and executes HTTP request", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);

      const rawPayload = { foo: "{{bar}}" };
      const rawHeaders = { "X-Test": "{{token}}" };
      const action = {
        name: "act1",
        type: "api" as const,
        endpoint: "https://api.example/{{id}}",
        method: "POST",
        payload: rawPayload,
        headers: rawHeaders,
      };
      const capturedVariables = { id: "123" };
      const moduleVariables = { bar: "baz", token: "tkn" };

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
        return value;
      });

      const executor = new ActionExecutor([action], {
        captureVars: ["captured"],
        headless: true,
        browserSession,
      });

      const result = await executor.executeAction("act1", capturedVariables, moduleVariables);

      // Variables should be merged (captured > module > global)
      const expectedVars = { bar: "baz", token: "tkn", id: "123" };

      expect(mocks.applyTemplate).toHaveBeenCalledWith(action.endpoint, expectedVars);
      expect(mocks.applyTemplate).toHaveBeenCalledWith(rawPayload, expectedVars);
      expect(mocks.applyTemplate).toHaveBeenCalledWith(rawHeaders, expectedVars);

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

      expect(mocks.browserNavigate).not.toHaveBeenCalled();
      expect(result).toEqual({ captured: "yes" });
    });

    it("serializes payload as URLSearchParams for application/x-www-form-urlencoded", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);

      const action = {
        name: "actUrlEncoded",
        type: "api" as const,
        endpoint: "https://api.example/token",
        method: "POST",
        payload: { client_id: "test", client_secret: "secret" },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      };

      const executor = new ActionExecutor([action], {
        captureVars: [],
        headless: true,
        browserSession,
      });

      await executor.executeAction("actUrlEncoded", {}, {});

      expect(mocks.requestJson).toHaveBeenCalledWith(
        "https://api.example/token",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
          body: "client_id=test&client_secret=secret",
        }),
        "ok",
        expect.anything()
      );
    });

    it("executes action without payload or headers", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);

      const action = {
        name: "act2",
        type: "api" as const,
        endpoint: "https://api.example/health",
        method: "GET",
      };

      const executor = new ActionExecutor([action], {
        captureVars: [],
        headless: true,
        browserSession,
      });

      const result = await executor.executeAction("act2", {}, {});

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
      expect(mocks.browserNavigate).not.toHaveBeenCalled();
      expect(result).toEqual({ captured: "yes" });
    });
  });

  describe("Browser actions", () => {
    it("navigates and captures final URL", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);

      const action = {
        name: "nav1",
        type: "browser" as const,
        operation: "navigate" as const,
        url: "https://redirect/{{id}}",
        wait_for: "networkidle" as const,
      };
      const capturedVariables = { id: "456" };
      const moduleVariables = {};

      mocks.applyTemplate.mockImplementation((value: unknown) => {
        if (value === action.url) {
          return "https://redirect/456";
        }
        return value;
      });

      const executor = new ActionExecutor([action], {
        captureVars: ["result"],
        headless: true,
        browserSession,
      });

      const result = await executor.executeAction("nav1", capturedVariables, moduleVariables);

      expect(mocks.applyTemplate).toHaveBeenCalledWith(action.url, { id: "456" });
      expect(mocks.browserNavigate).toHaveBeenCalledWith("https://redirect/456", "networkidle");
      expect(mocks.captureFromObject).toHaveBeenCalledWith(
        "https://final.example",
        ["result"],
        result
      );
      expect(mocks.requestJson).not.toHaveBeenCalled();
    });

    it("supports different wait strategies", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);

      const action = {
        name: "nav2",
        type: "browser" as const,
        operation: "navigate" as const,
        url: "https://example.com",
        wait_for: "domcontentloaded" as const,
      };

      const executor = new ActionExecutor([action], {
        captureVars: [],
        headless: true,
        browserSession,
      });

      await executor.executeAction("nav2", {}, {});

      expect(mocks.browserNavigate).toHaveBeenCalledWith("https://example.com", "domcontentloaded");
    });
  });

  describe("Variable merging", () => {
    it("merges variables with correct precedence: captured > module > global", async () => {
      const { ActionExecutor, mocks } = setupActionExecutor();
      const browserSession = new mocks.BrowserSession(true);

      const action = {
        name: "test",
        type: "api" as const,
        endpoint: "https://api.example/{{var1}}/{{var2}}/{{var3}}",
        method: "GET",
      };

      const globalVariables = { var1: "global1", var2: "global2", var3: "global3" };
      const moduleVariables = { var2: "module2", var3: "module3" };
      const capturedVariables = { var3: "captured3" };

      mocks.applyTemplate.mockImplementation((value: unknown) => {
        if (value === action.endpoint) {
          return "https://api.example/global1/module2/captured3";
        }
        return value;
      });

      const executor = new ActionExecutor([action], {
        captureVars: [],
        headless: true,
        globalVariables,
        browserSession,
      });

      await executor.executeAction("test", capturedVariables, moduleVariables);

      // Verify merged variables: captured3 > module2 > global1
      const expectedMerged = { var1: "global1", var2: "module2", var3: "captured3" };
      expect(mocks.applyTemplate).toHaveBeenCalledWith(action.endpoint, expectedMerged);
    });
  });
});

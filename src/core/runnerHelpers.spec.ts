import { loadIsolatedModule } from "../testUtils/isolateModule";
import type { RunnerInfo } from "./conformanceApi";
import type { Logger } from "./logger";
import type { TestState, TestResult } from "./types";

describe("runnerHelpers", () => {
  const createMocks = () => {
    const mockApi = {
      getModuleInfo: jest.fn(),
      getRunnerInfo: jest.fn(),
      getModuleLogs: jest.fn(),
    };

    const mockLogger: Logger = {
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      summary: jest.fn(),
    };

    const mockActionExecutor = {
      executeAction: jest.fn(),
    };

    const mockNavigateWithPlaywright = jest.fn();
    const mockCaptureFromObject = jest.fn();
    const mockSleep = jest.fn().mockResolvedValue(undefined);

    return {
      mockApi,
      mockLogger,
      mockActionExecutor,
      mockNavigateWithPlaywright,
      mockCaptureFromObject,
      mockSleep,
    };
  };

  const loadModule = (mocks: ReturnType<typeof createMocks>) => {
    const {
      mockApi,
      mockLogger,
      mockActionExecutor,
      mockNavigateWithPlaywright,
      mockCaptureFromObject,
      mockSleep,
    } = mocks;

    const { pollRunnerStatus } = loadIsolatedModule(
      () => {
        jest.doMock("./playwrightRunner", () => ({
          navigateWithPlaywright: mockNavigateWithPlaywright,
        }));
        jest.doMock("./capture", () => ({
          captureFromObject: mockCaptureFromObject,
        }));
        jest.doMock("../utils/sleep", () => ({
          sleep: mockSleep,
        }));
        jest.doMock("./constants", () => ({
          CONSTANTS: {
            CALLBACK_VARIABLE_NAME: "redirect_to",
            POLL_INTERVAL_SECONDS_DEFAULT: 5,
            TIMEOUT_SECONDS_DEFAULT: 240,
          },
        }));
      },
      () => require("./runnerHelpers")
    );

    return { pollRunnerStatus };
  };

  const createContext = (mocks: ReturnType<typeof createMocks>) => ({
    api: mocks.mockApi,
    pollInterval: 1,
    timeout: 10,
    headless: true,
    logger: mocks.mockLogger,
  });

  describe("pollRunnerStatus", () => {
    test("returns state and info when FINISHED is reached", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo.mockResolvedValue({
        status: "FINISHED",
        result: "PASSED",
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      const result = await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["token"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(result.state).toBe("FINISHED");
      expect(result.info.status).toBe("FINISHED");
      expect(result.info.result).toBe("PASSED");
      expect(mocks.mockApi.getModuleInfo).toHaveBeenCalledWith("runner-1", {
        captureVars: ["token"],
        store: captured,
      });
    });

    test("returns state and info when INTERRUPTED is reached", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo.mockResolvedValue({
        status: "INTERRUPTED",
        result: "FAILED",
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      const result = await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(result.state).toBe("INTERRUPTED");
      expect(result.info.result).toBe("FAILED");
    });

    test("throws error when timeout is exceeded", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      // Always return RUNNING to never exit the polling loop
      mocks.mockApi.getModuleInfo.mockResolvedValue({
        status: "RUNNING",
        result: "UNKNOWN",
      });
      mocks.mockSleep.mockResolvedValue(undefined);

      const context = createContext(mocks);
      context.timeout = 1; // Very short timeout in seconds
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await expect(
        pollRunnerStatus({
          context,
          runnerId: "runner-1",
          moduleName: "test-module",
          captureVars: [],
          captured,
          actions: [],
          actionExecutor: mocks.mockActionExecutor,
          executedActions,
          isNavigationExecuted: () => navigationExecuted,
          markNavigationExecuted: () => {
            navigationExecuted = true;
          },
        })
      ).rejects.toThrow("Timeout waiting for runner runner-1");
    });

    test("polls at specified interval before returning", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      // Return RUNNING on first call, then FINISHED
      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "RUNNING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      const context = createContext(mocks);
      context.pollInterval = 2;
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockSleep).toHaveBeenCalledWith(2000); // pollInterval * 1000 converts to milliseconds
    });

    test("captures variables from module info", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo.mockResolvedValue({
        status: "FINISHED",
        result: "PASSED",
        token: "abc123",
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["token"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockCaptureFromObject).toHaveBeenCalled();
    });

    test("handles WAITING state correctly", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/test"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/test?code=xyz"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      const result = await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["code"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(result.state).toBe("FINISHED");
      expect(mocks.mockApi.getRunnerInfo).toHaveBeenCalledWith("runner-1", {
        captureVars: ["code"],
        store: captured,
      });
      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledWith(
        "https://example.com/test",
        true
      );
    });

    test("logs polling status at each iteration", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "RUNNING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        "[test-module]: Polling... State: RUNNING"
      );
      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        "[test-module]: Polling... State: FINISHED"
      );
    });
  });

  describe("handleWaitingState", () => {
    test("navigates to URL from browser.urls when available", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo.mockResolvedValue({
        status: "WAITING",
        result: "UNKNOWN",
      });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth?state=xyz"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/auth?state=xyz&code=abc"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      // Need to keep WAITING state after first poll to test WAITING handler
      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["code"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledWith(
        "https://example.com/auth?state=xyz",
        true
      );
    });

    test("prefers browser.urls[0] over urlsWithMethod GET", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://preferred.com/url"],
          urlsWithMethod: [
            {
              url: "https://fallback.com/url",
              method: "GET",
            },
          ],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://preferred.com/url"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledWith(
        "https://preferred.com/url",
        expect.any(Boolean)
      );
    });

    test("falls back to urlsWithMethod GET when browser.urls is empty", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: [],
          urlsWithMethod: [
            {
              url: "https://fallback.com/auth",
              method: "GET",
            },
          ],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://fallback.com/auth?state=abc"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledWith(
        "https://fallback.com/auth",
        expect.any(Boolean)
      );
    });

    test("skips navigation when no URLs are available", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: [],
          urlsWithMethod: [],
        },
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockNavigateWithPlaywright).not.toHaveBeenCalled();
      expect(navigationExecuted).toBe(false);
    });

    test("navigation only executes once even if WAITING state is reached multiple times", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/auth?code=xyz"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["action1"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      // Navigation should only be called once, even though we had multiple WAITING states
      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledTimes(1);
    });

    test("executes actions after navigation is complete", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([
        { log: "test log" },
      ]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({
        response_code: "200",
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["submit-form"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalledWith(
        "submit-form",
        captured
      );
    });

    test("skips action execution if navigation failed", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: [],
          urlsWithMethod: [],
        },
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["submit-form"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockActionExecutor.executeAction).not.toHaveBeenCalled();
    });

    test("navigates to callback URL when callback variable is captured", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright
        .mockResolvedValueOnce(
          "https://example.com/callback?code=xyz&state=abc"
        )
        .mockResolvedValueOnce("https://myapp.com/callback?code=xyz&session=def");

      const context = createContext(mocks);
      // Pre-populate the callback variable to trigger callback navigation
      const captured: Record<string, string> = {
        redirect_to: "https://myapp.com/callback",
      };
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["code"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      // Verify both navigations occurred: one to auth URL, one to callback
      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledTimes(2);
      expect(mocks.mockNavigateWithPlaywright).toHaveBeenNthCalledWith(
        1,
        "https://example.com/auth",
        true
      );
      expect(mocks.mockNavigateWithPlaywright).toHaveBeenNthCalledWith(
        2,
        "https://myapp.com/callback",
        true
      );
    });

    test("captures variables from callback URL navigation", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://myapp.com/callback?code=xyz&session=abc123"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {
        redirect_to: "https://myapp.com/callback?code=xyz",
      };
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["code", "session"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      // Verify capture was called on the final URL after callback navigation
      const captureCallsWithUrl = mocks.mockCaptureFromObject.mock.calls.filter(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("myapp.com/callback")
      );
      expect(captureCallsWithUrl.length).toBeGreaterThan(0);
    });
  });

  describe("tryExecuteActions", () => {
    test("executes all configured actions", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({});

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["action1", "action2"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalledWith(
        "action1",
        expect.any(Object)
      );
      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalledWith(
        "action2",
        expect.any(Object)
      );
      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalledTimes(2);
    });

    test("skips already executed actions", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({});

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>(["action1"]); // action1 already executed
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["action1", "action2"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      // Should only execute action2, skipping action1
      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalledWith(
        "action2",
        expect.any(Object)
      );
      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalledTimes(1);
    });

    test("captures variables from action responses", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({
        new_token: "token123",
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["submit-form"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      // Verify that newly captured variables are merged into the captured object
      expect(captured.new_token).toBe("token123");
    });

    test("fetches logs before executing actions", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([
        { entry: "log entry" },
      ]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({});

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["submit-form"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockApi.getModuleLogs).toHaveBeenCalledWith("runner-1", {
        captureVars: [],
        store: captured,
      });
    });

    test("logs action execution progress", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({});

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: ["submit-form"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        "[test-module]: Executing action 'submit-form'..."
      );
      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        "[test-module]: Action 'submit-form' completed."
      );
    });
  });

  describe("navigateToUrl", () => {
    test("logs when no URLs are available", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: [],
          urlsWithMethod: [],
        },
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining("No browser URL found")
      );
    });

    test("captures variables from target URL", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth?state=xyz&client=app"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback?code=abc&state=xyz"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: ["state", "code"],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      // Should capture from both the target URL and final URL
      expect(mocks.mockCaptureFromObject).toHaveBeenCalled();
    });

    test("logs successful navigation", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback?code=xyz"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        "[test-module]: Navigating to URL: https://example.com/auth"
      );
      expect(mocks.mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining("Navigation completed for URL")
      );
    });

    test("respects headless browser setting", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      const context = createContext(mocks);
      context.headless = false;
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledWith(
        expect.any(String),
        false
      );
    });
  });

  describe("error handling", () => {
    test("handles API errors gracefully", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo.mockRejectedValue(
        new Error("API connection failed")
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await expect(
        pollRunnerStatus({
          context,
          runnerId: "runner-1",
          moduleName: "test-module",
          captureVars: [],
          captured,
          actions: [],
          actionExecutor: mocks.mockActionExecutor,
          executedActions,
          isNavigationExecuted: () => navigationExecuted,
          markNavigationExecuted: () => {
            navigationExecuted = true;
          },
        })
      ).rejects.toThrow("API connection failed");
    });

    test("handles navigation errors gracefully", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockRejectedValue(
        new Error("Browser crashed")
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await expect(
        pollRunnerStatus({
          context,
          runnerId: "runner-1",
          moduleName: "test-module",
          captureVars: [],
          captured,
          actions: [],
          actionExecutor: mocks.mockActionExecutor,
          executedActions,
          isNavigationExecuted: () => navigationExecuted,
          markNavigationExecuted: () => {
            navigationExecuted = true;
          },
        })
      ).rejects.toThrow("Browser crashed");
    });

    test("handles action execution errors", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([]);

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback"
      );

      mocks.mockActionExecutor.executeAction.mockRejectedValue(
        new Error("HTTP 500 from action endpoint")
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      await expect(
        pollRunnerStatus({
          context,
          runnerId: "runner-1",
          moduleName: "test-module",
          captureVars: [],
          captured,
          actions: ["submit-form"],
          actionExecutor: mocks.mockActionExecutor,
          executedActions,
          isNavigationExecuted: () => navigationExecuted,
          markNavigationExecuted: () => {
            navigationExecuted = true;
          },
        })
      ).rejects.toThrow("HTTP 500 from action endpoint");
    });
  });

  describe("integration scenarios", () => {
    test("complete flow: poll -> wait -> navigate -> action -> finished", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "RUNNING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://server.com/authorize"],
          urlsWithMethod: [],
        },
      });

      mocks.mockApi.getModuleLogs.mockResolvedValue([]);

      mocks.mockNavigateWithPlaywright
        .mockResolvedValueOnce(
          "https://server.com/authorize?state=xyz&code=auth-code"
        )
        .mockResolvedValueOnce(
          "https://myapp.com/callback?authorization_code=auth-code"
        );

      mocks.mockActionExecutor.executeAction.mockResolvedValue({
        access_token: "at-123",
      });

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      const result = await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "oauth-flow",
        captureVars: ["code", "access_token"],
        captured,
        actions: ["exchange-code"],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(result.state).toBe("FINISHED");
      expect(result.info.result).toBe("PASSED");
      expect(mocks.mockApi.getModuleInfo).toHaveBeenCalledTimes(3);
      expect(mocks.mockNavigateWithPlaywright).toHaveBeenCalledTimes(1);
      expect(mocks.mockActionExecutor.executeAction).toHaveBeenCalled();
      expect(captured.access_token).toBe("at-123");
    });

    test("handles multiple polls before WAITING state", async () => {
      const mocks = createMocks();
      const { pollRunnerStatus } = loadModule(mocks);

      mocks.mockApi.getModuleInfo
        .mockResolvedValueOnce({
          status: "CONFIGURED",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "RUNNING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "RUNNING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "WAITING",
          result: "UNKNOWN",
        })
        .mockResolvedValueOnce({
          status: "FINISHED",
          result: "PASSED",
        });

      mocks.mockApi.getRunnerInfo.mockResolvedValue({
        status: "WAITING",
        browser: {
          urls: ["https://example.com/auth"],
          urlsWithMethod: [],
        },
      });

      mocks.mockNavigateWithPlaywright.mockResolvedValue(
        "https://example.com/callback?code=xyz"
      );

      const context = createContext(mocks);
      const captured: Record<string, string> = {};
      const executedActions = new Set<string>();
      let navigationExecuted = false;

      const result = await pollRunnerStatus({
        context,
        runnerId: "runner-1",
        moduleName: "test-module",
        captureVars: [],
        captured,
        actions: [],
        actionExecutor: mocks.mockActionExecutor,
        executedActions,
        isNavigationExecuted: () => navigationExecuted,
        markNavigationExecuted: () => {
          navigationExecuted = true;
        },
      });

      expect(result.state).toBe("FINISHED");
      expect(mocks.mockSleep).toHaveBeenCalledTimes(4);
    });
  });
});

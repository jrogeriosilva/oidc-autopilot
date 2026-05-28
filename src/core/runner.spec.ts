import type { PlanConfig } from "../config/schema";
import { loadIsolatedModule } from "../testUtils/isolateModule";

describe("Runner", () => {
  const setupRunner = async () => {
    const mocks = {
      captureFromObject: vi.fn(),
      browserNavigate: vi.fn().mockResolvedValue("http://final"),
      browserClose: vi.fn().mockResolvedValue(undefined),
      browserInitialize: vi.fn().mockResolvedValue(undefined),
      sleep: vi.fn().mockResolvedValue(undefined),
      ActionExecutor: vi.fn(),
      BrowserSession: vi.fn(),
    };

    const Runner = await loadIsolatedModule(
      () => {
        vi.doMock("./capture", () => ({ captureFromObject: mocks.captureFromObject }));
        vi.doMock("./browserSession", () => ({
          BrowserSession: mocks.BrowserSession.mockImplementation(() => ({
            navigate: mocks.browserNavigate,
            close: mocks.browserClose,
            initialize: mocks.browserInitialize,
            isInitialized: vi.fn().mockReturnValue(true),
          })),
        }));
        vi.doMock("../utils/sleep", () => ({ sleep: mocks.sleep }));
        vi.doMock("./actions", () => ({ ActionExecutor: mocks.ActionExecutor }));
      },
      () => import("./runner").then((m) => m.Runner)
    );

    return { Runner, mocks };
  };

  const createRunner = (Runner: any, api: unknown) => {
    const logger = {
      log: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      summary: vi.fn(),
    };
    const runner = new Runner({
      api,
      pollInterval: 0,
      timeout: 5,
      headless: true,
      logger,
    });
    return { runner, logger };
  };

  const createConfig = (overrides: Partial<PlanConfig> = {}): PlanConfig => ({
    capture_vars: [],
    variables: {},
    actions: [],
    modules: [],
    ...overrides,
  });

  const actionConfig = {
    name: "act1",
    type: "api" as const,
    endpoint: "https://example.com/act1",
    method: "GET",
  };

  test("executePlan aggregates results and interrupted counts", async () => {
    const { Runner, mocks } = await setupRunner();

    mocks.ActionExecutor.mockImplementation(() => ({ executeAction: vi.fn() }));

    const api = {
      registerRunner: vi.fn().mockResolvedValueOnce("r1").mockResolvedValueOnce("r2"),
      getModuleInfo: vi.fn(async (runnerId: string) => {
        if (runnerId === "r1") {
          return { status: "FINISHED", result: "PASSED" };
        }
        return { status: "INTERRUPTED", result: "FAILED" };
      }),
      getRunnerInfo: vi.fn(),
      getModuleLogs: vi.fn(),
    };

    const { runner } = createRunner(Runner, api);

    const config = createConfig({
      modules: [
        { name: "module-1", variables: {} },
        { name: "module-2", variables: {} },
      ],
    });

    const summary = await runner.executePlan({ planId: "p1", config });

    expect(summary.total).toBe(2);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.interrupted).toBe(1);
    expect(summary.modules[0].runnerId).toBe("r1");
    expect(summary.modules[1].runnerId).toBe("r2");
  });

  test("executes navigation and actions once", async () => {
    const { Runner, mocks } = await setupRunner();

    const executeAction = vi.fn().mockResolvedValue({});
    mocks.ActionExecutor.mockImplementation(() => ({ executeAction }));
    mocks.browserNavigate.mockResolvedValueOnce("http://final1");

    const api = {
      registerRunner: vi.fn().mockResolvedValue("r1"),
      getModuleInfo: vi.fn()
        .mockResolvedValueOnce({ status: "WAITING", result: "UNKNOWN" })
        .mockResolvedValueOnce({ status: "FINISHED", result: "PASSED" }),
      getRunnerInfo: vi.fn().mockResolvedValue({
        browser: { urls: ["http://start"], urlsWithMethod: [] },
      }),
      getModuleLogs: vi.fn().mockResolvedValue({ entries: [] }),
    };

    const { runner } = createRunner(Runner, api);

    const config = createConfig({
      actions: [{ ...actionConfig, type: "api" as const }],
      modules: [{ name: "module-1", variables: {}, actions: ["act1"] }],
    });

    await runner.executePlan({ planId: "p1", config });

    expect(api.getRunnerInfo).toHaveBeenCalledTimes(1);
    expect(executeAction).toHaveBeenCalledTimes(1);
    expect(executeAction).toHaveBeenCalledWith("act1", expect.any(Object), {}, expect.objectContaining({
      correlationId: expect.any(String),
      moduleName: "module-1",
      actionName: "act1",
    }));
    expect(mocks.browserNavigate).toHaveBeenCalledTimes(1);
    expect(mocks.browserNavigate).toHaveBeenCalledWith("http://start");
    expect(mocks.sleep).toHaveBeenCalledTimes(1);
    expect(mocks.browserClose).toHaveBeenCalledTimes(1);
  });

  test("executes actions once and captures vars during WAITING", async () => {
    const { Runner, mocks } = await setupRunner();

    mocks.captureFromObject.mockImplementation(
      (source: unknown, vars: string[], store: Record<string, string>) => {
        if (!source || typeof source !== "object") {
          return;
        }
        for (const key of vars) {
          const value = (source as Record<string, unknown>)[key];
          if (typeof value === "string") {
            store[key] = value;
          }
        }
      }
    );

    const executeAction = vi.fn().mockResolvedValue({ actionValue: "yes" });
    mocks.ActionExecutor.mockImplementation(() => ({ executeAction }));

    const api = {
      registerRunner: vi.fn().mockResolvedValue("r1"),
      getModuleInfo: vi.fn()
        .mockResolvedValueOnce({ status: "WAITING", result: "UNKNOWN" })
        .mockResolvedValueOnce({ status: "FINISHED", result: "PASSED" }),
      getRunnerInfo: vi.fn().mockResolvedValue({
        browser: { urls: ["http://start"], urlsWithMethod: [] },
      }),
      getModuleLogs: vi.fn().mockResolvedValue({ fromLog: "log-value" }),
    };

    const { runner } = createRunner(Runner, api);

    const config = createConfig({
      capture_vars: ["fromLog"],
      actions: [actionConfig],
      modules: [{ name: "module-1", variables: {}, actions: ["act1"] }],
    });

    const summary = await runner.executePlan({ planId: "p1", config });

    expect(executeAction).toHaveBeenCalledTimes(1);
    expect(api.getModuleLogs).toHaveBeenCalledTimes(1);
    expect(summary.modules[0].captured.fromLog).toBe("log-value");
    expect(summary.modules[0].captured.actionValue).toBe("yes");
  });

  test("stops polling when interrupted and skips actions", async () => {
    const { Runner, mocks } = await setupRunner();

    const executeAction = vi.fn();
    mocks.ActionExecutor.mockImplementation(() => ({ executeAction }));

    const api = {
      registerRunner: vi.fn().mockResolvedValue("r1"),
      getModuleInfo: vi.fn()
        .mockResolvedValueOnce({ status: "INTERRUPTED", result: "FAILED" }),
      getRunnerInfo: vi.fn(),
      getModuleLogs: vi.fn(),
    };

    const { runner } = createRunner(Runner, api);

    const config = createConfig({
      actions: [actionConfig],
      modules: [{ name: "module-1", variables: {}, actions: ["act1"] }],
    });

    const summary = await runner.executePlan({ planId: "p1", config });

    expect(summary.modules[0].state).toBe("INTERRUPTED");
    expect(api.getRunnerInfo).not.toHaveBeenCalled();
    expect(api.getModuleLogs).not.toHaveBeenCalled();
    expect(executeAction).not.toHaveBeenCalled();
    expect(mocks.sleep).not.toHaveBeenCalled();
  });

  test("does not execute actions when no browser URL is available", async () => {
    const { Runner, mocks } = await setupRunner();

    const executeAction = vi.fn().mockResolvedValue({});
    mocks.ActionExecutor.mockImplementation(() => ({ executeAction }));

    const api = {
      registerRunner: vi.fn().mockResolvedValue("r1"),
      getModuleInfo: vi.fn()
        .mockResolvedValueOnce({ status: "WAITING", result: "UNKNOWN" })
        .mockResolvedValueOnce({ status: "FINISHED", result: "PASSED" }),
      getRunnerInfo: vi.fn().mockResolvedValue({
        browser: { urls: [], urlsWithMethod: [] },
      }),
      getModuleLogs: vi.fn().mockResolvedValue({ entries: [] }),
    };

    const { runner } = createRunner(Runner, api);

    const config = createConfig({
      actions: [actionConfig],
      modules: [{ name: "module-1", variables: {}, actions: ["act1"] }],
    });

    await runner.executePlan({ planId: "p1", config });

    expect(mocks.browserNavigate).not.toHaveBeenCalled();
    expect(executeAction).not.toHaveBeenCalled();
  });
});

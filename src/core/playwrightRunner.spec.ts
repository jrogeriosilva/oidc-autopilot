import { navigateWithPlaywright } from "./playwrightRunner";

const launch = jest.fn();

jest.mock("playwright", () => ({
  chromium: { launch: (...args: unknown[]) => launch(...args) },
}));

describe("navigateWithPlaywright", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates and returns final URL", async () => {
    const closeContext = jest.fn().mockResolvedValue(undefined);
    const closeBrowser = jest.fn().mockResolvedValue(undefined);
    const goto = jest.fn().mockResolvedValue(undefined);
    const url = jest.fn().mockReturnValue("https://final.example");

    const page = { goto, url };
    const context = {
      newPage: jest.fn().mockResolvedValue(page),
      close: closeContext,
    };
    const browser = {
      newContext: jest.fn().mockResolvedValue(context),
      close: closeBrowser,
    };
    launch.mockResolvedValue(browser);

    const result = await navigateWithPlaywright("https://start.example", true);

    expect(launch).toHaveBeenCalledWith({ headless: true });
    expect(browser.newContext).toHaveBeenCalledWith({ ignoreHTTPSErrors: true });
    expect(goto).toHaveBeenCalledWith("https://start.example", { waitUntil: "networkidle" });
    expect(result).toBe("https://final.example");
    expect(closeContext).toHaveBeenCalledTimes(1);
    expect(closeBrowser).toHaveBeenCalledTimes(1);
  });

  it("closes context and browser when navigation fails", async () => {
    const closeContext = jest.fn().mockResolvedValue(undefined);
    const closeBrowser = jest.fn().mockResolvedValue(undefined);
    const goto = jest.fn().mockRejectedValue(new Error("boom"));

    const page = { goto, url: jest.fn() };
    const context = {
      newPage: jest.fn().mockResolvedValue(page),
      close: closeContext,
    };
    const browser = {
      newContext: jest.fn().mockResolvedValue(context),
      close: closeBrowser,
    };
    launch.mockResolvedValue(browser);

    await expect(navigateWithPlaywright("https://start.example", false)).rejects.toThrow("boom");
    expect(closeContext).toHaveBeenCalledTimes(1);
    expect(closeBrowser).toHaveBeenCalledTimes(1);
  });
});

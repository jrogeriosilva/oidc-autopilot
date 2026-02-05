import { BrowserSession } from "./browserSession";

const launch = jest.fn();

jest.mock("playwright", () => ({
  chromium: { launch: (...args: unknown[]) => launch(...args) },
}));

describe("BrowserSession", () => {
  let closeContext: jest.Mock;
  let closeBrowser: jest.Mock;
  let goto: jest.Mock;
  let urlFn: jest.Mock;
  let page: { goto: jest.Mock; url: jest.Mock };
  let context: { newPage: jest.Mock; close: jest.Mock };
  let browser: { newContext: jest.Mock; close: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    closeContext = jest.fn().mockResolvedValue(undefined);
    closeBrowser = jest.fn().mockResolvedValue(undefined);
    goto = jest.fn().mockResolvedValue(undefined);
    urlFn = jest.fn().mockReturnValue("https://final.example");

    page = { goto, url: urlFn };
    context = {
      newPage: jest.fn().mockResolvedValue(page),
      close: closeContext,
    };
    browser = {
      newContext: jest.fn().mockResolvedValue(context),
      close: closeBrowser,
    };
    launch.mockResolvedValue(browser);
  });

  describe("initialize", () => {
    it("creates browser, context, and page", async () => {
      const session = new BrowserSession(true);

      await session.initialize();

      expect(launch).toHaveBeenCalledWith({ headless: true });
      expect(browser.newContext).toHaveBeenCalledWith({ ignoreHTTPSErrors: true });
      expect(context.newPage).toHaveBeenCalledTimes(1);
      expect(session.isInitialized()).toBe(true);
    });

    it("does not reinitialize if already initialized", async () => {
      const session = new BrowserSession(false);

      await session.initialize();
      await session.initialize();

      expect(launch).toHaveBeenCalledTimes(1);
      expect(browser.newContext).toHaveBeenCalledTimes(1);
    });
  });

  describe("navigate", () => {
    it("navigates and returns final URL with default wait strategy", async () => {
      const session = new BrowserSession(true);

      const result = await session.navigate("https://start.example");

      expect(goto).toHaveBeenCalledWith("https://start.example", {
        waitUntil: "networkidle",
      });
      expect(result).toBe("https://final.example");
    });

    it("supports custom wait strategies", async () => {
      const session = new BrowserSession(true);

      await session.navigate("https://start.example", "domcontentloaded");

      expect(goto).toHaveBeenCalledWith("https://start.example", {
        waitUntil: "domcontentloaded",
      });
    });

    it("reuses existing browser session for multiple navigations", async () => {
      const session = new BrowserSession(true);

      await session.navigate("https://first.example");
      await session.navigate("https://second.example");

      expect(launch).toHaveBeenCalledTimes(1);
      expect(browser.newContext).toHaveBeenCalledTimes(1);
      expect(goto).toHaveBeenCalledTimes(2);
    });

    it("initializes automatically if not initialized", async () => {
      const session = new BrowserSession(false);

      await session.navigate("https://start.example");

      expect(launch).toHaveBeenCalledWith({ headless: false });
      expect(session.isInitialized()).toBe(true);
    });
  });

  describe("close", () => {
    it("closes context and browser", async () => {
      const session = new BrowserSession(true);
      await session.navigate("https://start.example");

      await session.close();

      expect(closeContext).toHaveBeenCalledTimes(1);
      expect(closeBrowser).toHaveBeenCalledTimes(1);
      expect(session.isInitialized()).toBe(false);
    });

    it("handles close when not initialized", async () => {
      const session = new BrowserSession(true);

      await session.close();

      expect(closeContext).not.toHaveBeenCalled();
      expect(closeBrowser).not.toHaveBeenCalled();
    });
  });
});

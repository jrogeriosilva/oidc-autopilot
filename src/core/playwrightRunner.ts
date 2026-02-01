import { chromium } from "playwright";

export const navigateWithPlaywright = async (
  url: string,
  headless: boolean
): Promise<string> => {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    return page.url();
  } finally {
    await context.close();
    await browser.close();
  }
};

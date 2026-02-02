import { sleep } from "./sleep";

describe("sleep", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves after the requested delay", async () => {
    const promise = sleep(50);

    jest.advanceTimersByTime(50);

    await expect(promise).resolves.toBeUndefined();
  });
});

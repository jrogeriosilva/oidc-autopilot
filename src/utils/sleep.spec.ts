import { sleep } from "./sleep";

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after the requested delay", async () => {
    const promise = sleep(50);

    vi.advanceTimersByTime(50);

    await expect(promise).resolves.toBeUndefined();
  });
});

import { vi } from "vitest";

export const loadIsolatedModule = async <T>(
  setupMocks: () => void,
  loadModule: () => Promise<T>
): Promise<T> => {
  vi.resetModules();
  setupMocks();
  return loadModule();
};

export const loadIsolatedModule = <T>(
  setupMocks: () => void,
  loadModule: () => T
): T => {
  jest.resetModules();
  let module: T;
  jest.isolateModules(() => {
    setupMocks();
    module = loadModule();
  });
  return module!;
};

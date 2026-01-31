export const captureFromUrl = (
  url: string,
  captureVars: string[],
  store: Record<string, string>
): void => {
  try {
    const parsed = new URL(url);
    for (const key of captureVars) {
      const value = parsed.searchParams.get(key);
      if (value) {
        store[key] = value;
      }
    }
  } catch {
    return;
  }
};

const captureFromObjectInternal = (
  value: unknown,
  captureVars: string[],
  store: Record<string, string>
): void => {
  if (typeof value === "string") {
    captureFromUrl(value, captureVars, store);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => captureFromObjectInternal(entry, captureVars, store));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string" && captureVars.includes(key)) {
        store[key] = entry;
      }
      captureFromObjectInternal(entry, captureVars, store);
    }
  }
};

export const captureFromObject = (
  value: unknown,
  captureVars: string[],
  store: Record<string, string>
): void => {
  captureFromObjectInternal(value, captureVars, store);
};

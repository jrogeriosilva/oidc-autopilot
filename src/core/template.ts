export const applyTemplate = (value: unknown, variables: Record<string, string>): unknown => {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return variables[key] ?? `{{${key}}}`;
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyTemplate(item, variables));
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = applyTemplate(entry, variables);
    }
    return result;
  }

  return value;
};

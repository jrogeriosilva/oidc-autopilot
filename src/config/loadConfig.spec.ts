import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "./loadConfig";
import { planConfigSchema } from "./schema";

const writeTempConfig = (fileName: string, content: unknown): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "conformance-config-"));
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(content), "utf8");
  return filePath;
};

describe("loadConfig", () => {
  it("loads and validates a config file", () => {
    const filePath = writeTempConfig("sample.config.json", {
      modules: [{ name: "module-1" }],
      actions: [{ name: "action-1", type: "api", endpoint: "https://example.com" }],
    });

    const config = loadConfig(filePath);

    expect(config.modules).toEqual([{ name: "module-1", variables: {} }]);
    expect(config.actions).toEqual([
      { name: "action-1", type: "api", endpoint: "https://example.com", method: "POST" },
    ]);
    expect(config.capture_vars).toEqual([]);
    expect(config.variables).toEqual({});
  });

  it("rejects files without the .config.json suffix", () => {
    const filePath = writeTempConfig("invalid.json", { modules: [] });

    expect(() => loadConfig(filePath)).toThrow(
      'Invalid Name of "invalid.json". Use the suffix .config.json.'
    );
  });
});

describe("planConfigSchema", () => {
  it("applies defaults for optional arrays and objects", () => {
    const result = planConfigSchema.parse({ modules: [{ name: "module-1" }] });

    expect(result.capture_vars).toEqual([]);
    expect(result.actions).toEqual([]);
    expect(result.variables).toEqual({});
    expect(result.modules).toEqual([{ name: "module-1", variables: {} }]);
  });

  it("throws on invalid modules", () => {
    expect(() => planConfigSchema.parse({ modules: [{ name: "" }] })).toThrow();
  });
});
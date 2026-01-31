import fs from "node:fs";
import path from "node:path";
import { planConfigSchema, type PlanConfig } from "./schema";

export const loadConfig = (filePath: string): PlanConfig => {
  const baseName = path.basename(filePath);
  if (!baseName.endsWith(".config.json")) {
    throw new Error(
      `Invalid Name of "${baseName}". Use the suffix .config.json.`,
    );
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw) as unknown;
  return planConfigSchema.parse(json);
};

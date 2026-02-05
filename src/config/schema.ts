import { z } from "zod";

// Base schema for all actions
const baseActionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["api", "browser"]),
});

// API Action Schema (HTTP requests)
const apiActionSchema = baseActionSchema.extend({
  type: z.literal("api"),
  endpoint: z.string().min(1),
  method: z.string().min(1).default("POST"),
  payload: z.record(z.unknown()).optional(),
  headers: z.record(z.string()).optional(),
});

// Browser Action Schema (Playwright operations)
const browserActionSchema = baseActionSchema.extend({
  type: z.literal("browser"),
  operation: z.literal("navigate"),
  url: z.string().min(1),
  wait_for: z
    .enum(["networkidle", "domcontentloaded", "load"])
    .optional()
    .default("networkidle"),
});

// Discriminated union of action types
export const actionSchema = z.discriminatedUnion("type", [
  apiActionSchema,
  browserActionSchema,
]);

export const moduleSchema = z.object({
  name: z.string().min(1),
  actions: z.array(z.string()).optional(),
  variables: z.record(z.string()).optional().default({}),
});

export const planConfigSchema = z.object({
  capture_vars: z.array(z.string()).optional().default([]),
  variables: z.record(z.string()).optional().default({}),
  actions: z.array(actionSchema).optional().default([]),
  modules: z.array(moduleSchema).default([]),
});

export type PlanConfig = z.infer<typeof planConfigSchema>;
export type ActionConfig = z.infer<typeof actionSchema>;
export type ApiActionConfig = z.infer<typeof apiActionSchema>;
export type BrowserActionConfig = z.infer<typeof browserActionSchema>;
export type ModuleConfig = z.infer<typeof moduleSchema>;

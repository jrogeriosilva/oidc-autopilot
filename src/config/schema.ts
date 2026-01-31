import { z } from "zod";

export const actionSchema = z.object({
  name: z.string().min(1),
  endpoint: z.string().min(1),
  method: z.string().min(1).default("POST"),
  payload: z.record(z.unknown()).optional(),
  headers: z.record(z.string()).optional(),
  callback_to: z.string().optional(),
});

export const moduleSchema = z.object({
  name: z.string().min(1),
  actions: z.array(z.string()).optional(),
});

export const planConfigSchema = z.object({
  capture_vars: z.array(z.string()).optional().default([]),
  actions: z.array(actionSchema).optional().default([]),
  modules: z.array(moduleSchema).default([]),
});

export type PlanConfig = z.infer<typeof planConfigSchema>;
export type ActionConfig = z.infer<typeof actionSchema>;
export type ModuleConfig = z.infer<typeof moduleSchema>;

export interface LogLine {
  severity: string;
  message: string;
  moduleName: string | null;
  actionName: string | null;
  at: number;
}

export interface ModuleCard {
  name: string;
  status: string;
  result: string;
  lastMessage: string;
}

export interface EnvDefaults {
  planId: string;
  token: string;
  serverUrl: string;
}

export interface ModuleResult {
  name: string;
  runnerId: string;
  state: string;
  result: string;
  errorMessage?: string;
}

export interface ExecutionSummary {
  planId: string;
  total: number;
  passed: number;
  failed: number;
  warning: number;
  skipped: number;
  interrupted: number;
  modules: ModuleResult[];
}

export interface HealthResponse {
  executionInFlight: boolean;
  lineCount: number;
  outcome: ExecutionSummary | null;
  error: string | null;
  moduleCards: ModuleCard[];
}

export interface ConfigsResponse {
  files: string[];
}

export interface LaunchPayload {
  configPath: string;
  planId: string;
  token: string;
  serverUrl: string;
  pollInterval: number;
  timeout: number;
  headless: boolean;
}

// Config types (mirrored from backend schema)
export interface ApiActionConfig {
  name: string;
  type: "api";
  endpoint: string;
  method: string;
  payload?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface BrowserActionConfig {
  name: string;
  type: "browser";
  operation: "navigate";
  url: string;
  wait_for?: "networkidle" | "domcontentloaded" | "load";
}

export type ActionConfig = ApiActionConfig | BrowserActionConfig;

export interface ModuleConfig {
  name: string;
  actions?: string[];
  variables?: Record<string, string>;
}

export interface PlanConfig {
  capture_vars: string[];
  variables: Record<string, string>;
  actions: ActionConfig[];
  modules: ModuleConfig[];
}

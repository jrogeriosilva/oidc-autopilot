export type TestState =
  | "CREATED"
  | "CONFIGURED"
  | "WAITING"
  | "RUNNING"
  | "FINISHED"
  | "INTERRUPTED";

export type TestResult =
  | "PASSED"
  | "FAILED"
  | "WARNING"
  | "SKIPPED"
  | "REVIEW"
  | "UNKNOWN";

export interface ModuleResult {
  name: string;
  moduleId: string;
  state: TestState;
  result: TestResult;
  errorMessage?: string;
  captured: Record<string, string>;
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

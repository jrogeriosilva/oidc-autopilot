import type {
  HealthResponse,
  ConfigsResponse,
  EnvDefaults,
  LaunchPayload,
} from "../types/api";

export async function fetchHealth(): Promise<HealthResponse> {
  const r = await fetch("/api/health");
  if (!r.ok) throw new Error(`Health check failed: ${r.statusText}`);
  return r.json();
}

export async function fetchConfigs(): Promise<ConfigsResponse> {
  const r = await fetch("/api/configs");
  if (!r.ok) throw new Error(`Failed to fetch configs: ${r.statusText}`);
  return r.json();
}

export async function fetchEnvDefaults(): Promise<EnvDefaults> {
  const r = await fetch("/api/env-defaults");
  if (!r.ok) throw new Error(`Failed to fetch env defaults: ${r.statusText}`);
  return r.json();
}

export async function launchPlan(payload: LaunchPayload): Promise<void> {
  const r = await fetch("/api/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || r.statusText);
  }
}

export async function stopExecution(): Promise<void> {
  const r = await fetch("/api/stop", { method: "POST" });
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || r.statusText);
  }
}

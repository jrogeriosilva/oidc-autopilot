import type { PlanConfig } from "../types/api";

export async function fetchConfigFile(filename: string): Promise<PlanConfig> {
  const r = await fetch(`/api/config/${encodeURIComponent(filename)}`);
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || r.statusText);
  }
  return r.json();
}

export async function saveConfigFile(
  filename: string,
  config: PlanConfig,
): Promise<void> {
  const r = await fetch(`/api/config/${encodeURIComponent(filename)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || r.statusText);
  }
}

export async function deleteConfigFile(filename: string): Promise<void> {
  const r = await fetch(`/api/config/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || r.statusText);
  }
}

export async function fetchPlanInfo(
  planName: string,
): Promise<{ modules: Array<{ testModule: string }> }> {
  const r = await fetch(`/api/plan/info/${encodeURIComponent(planName)}`);
  if (!r.ok) {
    const body = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(body.error || r.statusText);
  }
  return r.json();
}

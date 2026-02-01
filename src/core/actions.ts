import type { ActionConfig } from "../config/schema";
import { applyTemplate } from "./template";
import { captureFromObject } from "./capture";
import { navigateWithPlaywright } from "./playwrightRunner";

export interface ActionExecutorOptions {
  captureVars: string[];
  headless: boolean;
}

export class ActionExecutor {
  private readonly actions: Map<string, ActionConfig>;
  private readonly captureVars: string[];
  private readonly headless: boolean;

  constructor(actions: ActionConfig[], options: ActionExecutorOptions) {
    this.actions = new Map(actions.map((action) => [action.name, action]));
    this.captureVars = options.captureVars;
    this.headless = options.headless;
  }

  getAction(name: string): ActionConfig | undefined {
    return this.actions.get(name);
  }

  async executeAction(
    name: string,
    variables: Record<string, string>
  ): Promise<Record<string, string>> {
    const action = this.actions.get(name);
    if (!action) {
      throw new Error(`Action '${name}' not found in config`);
    }

    const endpoint = applyTemplate(action.endpoint, variables) as string;
    const payload = action.payload
      ? (applyTemplate(action.payload, variables) as Record<string, unknown>)
      : undefined;
    const headers = action.headers
      ? (applyTemplate(action.headers, variables) as Record<string, string>)
      : undefined;

    const response = await fetch(endpoint, {
      method: action.method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Action '${name}' failed: HTTP ${response.status}: ${body}`);
    }

    const responseText = await response.text();
    let responseJson: unknown = {};
    if (responseText) {
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = {};
      }
    }
    const captured: Record<string, string> = {};
    captureFromObject(responseJson, this.captureVars, captured);

    const callbackUrl = action.callback_to
      ? (applyTemplate(action.callback_to, variables) as string)
      : undefined;
    if (callbackUrl) {
      const finalUrl = await navigateWithPlaywright(callbackUrl, this.headless);
      captureFromObject(finalUrl, this.captureVars, captured);
    }

    return captured;
  }
}

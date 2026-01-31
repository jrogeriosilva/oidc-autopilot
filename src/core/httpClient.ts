export interface HttpClientOptions {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "") + "/";
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  async requestJson<T>(
    url: string,
    init: RequestInit,
    expectedStatus: number | number[]
  ): Promise<T> {
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (!expected.includes(response.status)) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      const text = await response.text();
      return text ? (JSON.parse(text) as T) : ({} as T);
    } finally {
      clearTimeout(timeout);
    }
  }

  buildUrl(endpoint: string): string {
    return new URL(endpoint, this.baseUrl).toString();
  }

  getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }
}

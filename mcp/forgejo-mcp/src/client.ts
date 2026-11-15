export type ForgejoClientConfig = {
  baseUrl: string;
  token: string;
  accessClientId?: string;
  accessClientSecret?: string;
  fetchImpl?: typeof fetch;
};

export class ForgejoApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string
  ) {
    super(message);
    this.name = "ForgejoApiError";
  }
}

export class ForgejoClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly accessClientId?: string;
  private readonly accessClientSecret?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: ForgejoClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.token = config.token;
    this.accessClientId = config.accessClientId;
    this.accessClientSecret = config.accessClientSecret;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `token ${this.token}`,
    };
    if (this.accessClientId && this.accessClientSecret) {
      headers["CF-Access-Client-Id"] = this.accessClientId;
      headers["CF-Access-Client-Secret"] = this.accessClientSecret;
    }

    let payload: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const res = await this.fetchImpl(url.toString(), {
      method,
      headers,
      body: payload,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new ForgejoApiError(
        `Forgejo API ${method} ${path} failed`,
        res.status,
        text
      );
    }
    if (text === "") return undefined as T;
    return JSON.parse(text) as T;
  }

  get<T>(path: string, query?: Record<string, string | number | undefined>) {
    return this.request<T>("GET", path, undefined, query);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  repoPath(owner: string, repo: string, sub: string) {
    return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${sub}`;
  }

  async getText(
    path: string,
    accept = "text/plain",
    query?: Record<string, string | number | undefined>
  ): Promise<string> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
      }
    }
    const headers: Record<string, string> = {
      Accept: accept,
      Authorization: `token ${this.token}`,
    };
    if (this.accessClientId && this.accessClientSecret) {
      headers["CF-Access-Client-Id"] = this.accessClientId;
      headers["CF-Access-Client-Secret"] = this.accessClientSecret;
    }
    const res = await this.fetchImpl(url.toString(), { headers });
    const text = await res.text();
    if (!res.ok) {
      throw new ForgejoApiError(
        `Forgejo API GET ${path} failed`,
        res.status,
        text
      );
    }
    return text;
  }

  /** @internal tests */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
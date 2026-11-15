export type ForgejoClientConfig = {
    baseUrl: string;
    token: string;
    accessClientId?: string;
    accessClientSecret?: string;
    fetchImpl?: typeof fetch;
};
export declare class ForgejoApiError extends Error {
    status: number;
    body: string;
    constructor(message: string, status: number, body: string);
}
export declare class ForgejoClient {
    private readonly baseUrl;
    private readonly token;
    private readonly accessClientId?;
    private readonly accessClientSecret?;
    private readonly fetchImpl;
    constructor(config: ForgejoClientConfig);
    request<T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | undefined>): Promise<T>;
    get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
    repoPath(owner: string, repo: string, sub: string): string;
    getText(path: string, accept?: string, query?: Record<string, string | number | undefined>): Promise<string>;
    /** @internal tests */
    getBaseUrl(): string;
}

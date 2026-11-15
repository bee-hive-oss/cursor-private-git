export class ForgejoApiError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
        this.name = "ForgejoApiError";
    }
}
export class ForgejoClient {
    baseUrl;
    token;
    accessClientId;
    accessClientSecret;
    fetchImpl;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, "");
        this.token = config.token;
        this.accessClientId = config.accessClientId;
        this.accessClientSecret = config.accessClientSecret;
        this.fetchImpl = config.fetchImpl ?? fetch;
    }
    async request(method, path, body, query) {
        const url = new URL(`${this.baseUrl}/api/v1${path}`);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== "")
                    url.searchParams.set(k, String(v));
            }
        }
        const headers = {
            Accept: "application/json",
            Authorization: `token ${this.token}`,
        };
        if (this.accessClientId && this.accessClientSecret) {
            headers["CF-Access-Client-Id"] = this.accessClientId;
            headers["CF-Access-Client-Secret"] = this.accessClientSecret;
        }
        let payload;
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
            throw new ForgejoApiError(`Forgejo API ${method} ${path} failed`, res.status, text);
        }
        if (text === "")
            return undefined;
        return JSON.parse(text);
    }
    get(path, query) {
        return this.request("GET", path, undefined, query);
    }
    post(path, body) {
        return this.request("POST", path, body);
    }
    patch(path, body) {
        return this.request("PATCH", path, body);
    }
    put(path, body) {
        return this.request("PUT", path, body);
    }
    delete(path) {
        return this.request("DELETE", path);
    }
    repoPath(owner, repo, sub) {
        return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${sub}`;
    }
    async getText(path, accept = "text/plain", query) {
        const url = new URL(`${this.baseUrl}/api/v1${path}`);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== "")
                    url.searchParams.set(k, String(v));
            }
        }
        const headers = {
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
            throw new ForgejoApiError(`Forgejo API GET ${path} failed`, res.status, text);
        }
        return text;
    }
    /** @internal tests */
    getBaseUrl() {
        return this.baseUrl;
    }
}

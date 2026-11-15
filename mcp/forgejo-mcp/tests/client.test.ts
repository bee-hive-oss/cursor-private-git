import { describe, expect, it, vi } from "vitest";
import { ForgejoClient, ForgejoApiError } from "../src/client.js";
import { registerToolHandlers } from "../src/tools.js";

function mockFetch(routes: Record<string, { status: number; body: string }>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const key = `${init?.method ?? "GET"} ${u.pathname}${u.search}`;
    const hit = Object.entries(routes).find(([k]) => key.startsWith(k.split(" ")[0]) && u.pathname.includes(k.split(" ")[1]?.replace(/\?.*$/, "") ?? ""));
    const route = routes[key] ?? hit?.[1];
    if (!route) {
      return new Response("not found", { status: 404 });
    }
    return new Response(route.body, {
      status: route.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

describe("ForgejoClient", () => {
  it("sends auth and CF Access headers", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const client = new ForgejoClient({
      baseUrl: "https://git.example.com",
      token: "pat-test",
      accessClientId: "cid",
      accessClientSecret: "csec",
      fetchImpl,
    });
    await client.get("/version");
    const [, init] = fetchImpl.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("token pat-test");
    expect(headers["CF-Access-Client-Id"]).toBe("cid");
    expect(headers["CF-Access-Client-Secret"]).toBe("csec");
  });

  it("throws ForgejoApiError on failure", async () => {
    const client = new ForgejoClient({
      baseUrl: "https://git.example.com",
      token: "t",
      fetchImpl: async () => new Response("nope", { status: 403 }),
    });
    await expect(client.get("/repos/o/r")).rejects.toBeInstanceOf(ForgejoApiError);
  });
});

describe("tool handlers", () => {
  it("forgejo_list_pull_requests hits API path", async () => {
    const fetchImpl = mockFetch({
      "GET /api/v1/repos/acme/app/pulls": {
        status: 200,
        body: JSON.stringify([{ id: 1, title: "pr" }]),
      },
    });
    const client = new ForgejoClient({
      baseUrl: "https://git.example.com",
      token: "t",
      fetchImpl,
    });
    const tools = registerToolHandlers(client);
    const out = await tools.forgejo_list_pull_requests.run({
      owner: "acme",
      repo: "app",
    });
    expect(out).toEqual([{ id: 1, title: "pr" }]);
  });

  it("forgejo_create_issue posts body", async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body));
      expect(body.title).toBe("Bug");
      return new Response(JSON.stringify({ number: 3 }), { status: 201 });
    });
    const client = new ForgejoClient({
      baseUrl: "https://git.example.com",
      token: "t",
      fetchImpl: fetchImpl as typeof fetch,
    });
    const tools = registerToolHandlers(client);
    const out = await tools.forgejo_create_issue.run({
      owner: "acme",
      repo: "app",
      title: "Bug",
    });
    expect(out).toEqual({ number: 3 });
  });
});
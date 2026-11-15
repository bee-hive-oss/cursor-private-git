import { afterEach, describe, expect, it } from "vitest";
import { loadConfigFromEnv, trimForgejoEnvValue } from "../src/config.js";

const KEYS = [
  "FORGEJO_URL",
  "FORGEJO_TOKEN",
  "FORGEJO_CF_ACCESS_CLIENT_ID",
  "FORGEJO_CF_ACCESS_CLIENT_SECRET",
] as const;

const prior: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of KEYS) {
    if (prior[k] === undefined) delete process.env[k];
    else process.env[k] = prior[k];
  }
});

describe("trimForgejoEnvValue", () => {
  it("strips surrounding whitespace and newlines", () => {
    expect(trimForgejoEnvValue("  https://git.example.com\n")).toBe(
      "https://git.example.com"
    );
    expect(trimForgejoEnvValue("token\r\n")).toBe("token");
  });
});

describe("loadConfigFromEnv", () => {
  it("trims all FORGEJO_* values read from process.env", () => {
    for (const k of KEYS) prior[k] = process.env[k];
    process.env.FORGEJO_URL = " https://git.example.com \n";
    process.env.FORGEJO_TOKEN = "pat\n";
    process.env.FORGEJO_CF_ACCESS_CLIENT_ID = " cid ";
    process.env.FORGEJO_CF_ACCESS_CLIENT_SECRET = "sec\r\n";

    const cfg = loadConfigFromEnv();
    expect(cfg.baseUrl).toBe("https://git.example.com");
    expect(cfg.token).toBe("pat");
    expect(cfg.accessClientId).toBe("cid");
    expect(cfg.accessClientSecret).toBe("sec");
    expect(process.env.FORGEJO_TOKEN).toBe("pat");
  });
});
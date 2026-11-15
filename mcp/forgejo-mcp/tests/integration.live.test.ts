import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ForgejoClient } from "../src/client.js";
import { registerToolHandlers, type ToolName } from "../src/tools.js";

const baseUrl = process.env.FORGEJO_URL;
const token = process.env.FORGEJO_TOKEN;
const owner = process.env.FORGEJO_REPO_OWNER ?? "e2eadmin";
const repo = process.env.FORGEJO_REPO_NAME;
const e2eBranch = process.env.FORGEJO_E2E_BRANCH;
const headSha = process.env.FORGEJO_E2E_HEAD_SHA;

const live = Boolean(baseUrl && token && repo);

const toolResults: Record<string, "PASS" | "FAIL" | "SKIP"> = {};

describe.skipIf(!live)("Forgejo MCP — every tool (live 17.0.1)", () => {
  let client: ForgejoClient;
  let tools: ReturnType<typeof registerToolHandlers>;
  let issueIndex: number;
  let prIndex: number;
  let labelName: string;
  let commitSha: string;

  beforeAll(() => {
    client = new ForgejoClient({ baseUrl: baseUrl!, token: token! });
    tools = registerToolHandlers(client);
    labelName = `e2e-${Date.now()}`;
    commitSha = headSha ?? "";
  });

  afterEach((ctx) => {
    const name = ctx.task.name;
    if (name.startsWith("forgejo_")) {
      toolResults[name] = ctx.task.result?.state === "pass" ? "PASS" : "FAIL";
    }
  });

  afterAll(() => {
    const names = Object.keys(tools).sort() as ToolName[];
    console.log("\n[e2e] MCP per-tool results (Forgejo 17.0.1):");
    console.log("| Tool | Status |");
    console.log("|------|--------|");
    for (const name of names) {
      const status = toolResults[name] ?? "SKIP";
      console.log(`| ${name} | ${status} |`);
    }
  });

  it("forgejo_get_file_contents", async () => {
    const file = await tools.forgejo_get_file_contents.run({
      owner,
      repo: repo!,
      path: "README.md",
      ref: "main",
    });
    expect((file as { decoded?: string }).decoded ?? (file as { content?: string }).content).toBeTruthy();
  });

  it("forgejo_list_branches", async () => {
    const branches = (await tools.forgejo_list_branches.run({ owner, repo: repo! })) as {
      name: string;
    }[];
    expect(branches.map((b) => b.name)).toContain(e2eBranch ?? "main");
  });

  it("forgejo_create_label", async () => {
    const created = await tools.forgejo_create_label.run({
      owner,
      repo: repo!,
      name: labelName,
      color: "ff5500",
      description: "e2e label",
    });
    expect((created as { name: string }).name).toBe(labelName);
  });

  it("forgejo_list_labels", async () => {
    const labels = (await tools.forgejo_list_labels.run({ owner, repo: repo! })) as {
      name: string;
    }[];
    expect(labels.some((l) => l.name === labelName)).toBe(true);
  });

  it("forgejo_create_issue", async () => {
    const issue = (await tools.forgejo_create_issue.run({
      owner,
      repo: repo!,
      title: "e2e issue",
      body: "from integration",
    })) as { number: number };
    issueIndex = issue.number;
    expect(issueIndex).toBeGreaterThan(0);
  });

  it("forgejo_list_issues", async () => {
    const issues = (await tools.forgejo_list_issues.run({
      owner,
      repo: repo!,
      state: "open",
    })) as { number: number }[];
    expect(issues.some((i) => i.number === issueIndex)).toBe(true);
  });

  it("forgejo_get_issue", async () => {
    const issue = (await tools.forgejo_get_issue.run({
      owner,
      repo: repo!,
      index: issueIndex,
    })) as { title: string };
    expect(issue.title).toBe("e2e issue");
  });

  it("forgejo_create_issue_comment", async () => {
    const comment = await tools.forgejo_create_issue_comment.run({
      owner,
      repo: repo!,
      index: issueIndex,
      body: "e2e comment",
    });
    expect((comment as { body: string }).body).toContain("e2e comment");
  });

  it("forgejo_add_issue_labels", async () => {
    const labeled = (await tools.forgejo_add_issue_labels.run({
      owner,
      repo: repo!,
      index: issueIndex,
      labels: [labelName],
    })) as { name: string }[];
    expect(labeled.some((l) => l.name === labelName)).toBe(true);
  });

  it("forgejo_create_pull_request", async () => {
    const pr = (await tools.forgejo_create_pull_request.run({
      owner,
      repo: repo!,
      title: "e2e MCP pull request",
      head: e2eBranch ?? "main",
      base: "main",
      body: "Created by integration.live.test.ts",
    })) as { number: number; mergeable: boolean };
    prIndex = pr.number;
    expect(prIndex).toBeGreaterThan(0);
  });

  it("forgejo_list_pull_requests", async () => {
    const pulls = (await tools.forgejo_list_pull_requests.run({
      owner,
      repo: repo!,
      state: "open",
    })) as { number: number }[];
    expect(pulls.some((p) => p.number === prIndex)).toBe(true);
  });

  it("forgejo_get_pull_request", async () => {
    const pr = (await tools.forgejo_get_pull_request.run({
      owner,
      repo: repo!,
      index: prIndex,
    })) as { title: string };
    expect(pr.title).toContain("e2e MCP pull request");
  });

  it("forgejo_update_pull_request", async () => {
    const pr = (await tools.forgejo_update_pull_request.run({
      owner,
      repo: repo!,
      index: prIndex,
      title: "e2e MCP pull request (updated)",
    })) as { title: string };
    expect(pr.title).toContain("updated");
  });

  it("forgejo_pull_request_diff", async () => {
    const diff = await tools.forgejo_pull_request_diff.run({
      owner,
      repo: repo!,
      index: prIndex,
    });
    expect((diff as { diff: string }).diff.length).toBeGreaterThan(0);
  });

  it("forgejo_pull_request_files", async () => {
    const files = (await tools.forgejo_pull_request_files.run({
      owner,
      repo: repo!,
      index: prIndex,
    })) as { filename: string }[];
    expect(files.some((f) => f.filename === "README.md")).toBe(true);
  });

  it("forgejo_add_pull_request_labels", async () => {
    const labeled = (await tools.forgejo_add_pull_request_labels.run({
      owner,
      repo: repo!,
      index: prIndex,
      labels: [labelName],
    })) as { name: string }[];
    expect(labeled.some((l) => l.name === labelName)).toBe(true);
  });

  it("forgejo_create_pull_review", async () => {
    const review = await tools.forgejo_create_pull_review.run({
      owner,
      repo: repo!,
      index: prIndex,
      body: "e2e review comment",
      event: "COMMENT",
    });
    expect((review as { body?: string }).body ?? "ok").toBeTruthy();
  });

  it("forgejo_list_pull_review_comments", async () => {
    const payload = (await tools.forgejo_list_pull_review_comments.run({
      owner,
      repo: repo!,
      index: prIndex,
    })) as { reviews: { body?: string }[]; issueComments: unknown[] };
    expect(payload.reviews.length).toBeGreaterThan(0);
    expect(payload.reviews[0].body).toContain("e2e review");
  });

  it("forgejo_create_commit_status", async () => {
    if (!commitSha) {
      const branch = (await tools.forgejo_list_branches.run({ owner, repo: repo! })) as {
        name: string;
        commit: { id: string };
      }[];
      const hit = branch.find((b) => b.name === (e2eBranch ?? "main"));
      commitSha = hit?.commit.id ?? "";
    }
    expect(commitSha.length).toBeGreaterThan(6);
    const status = await tools.forgejo_create_commit_status.run({
      owner,
      repo: repo!,
      sha: commitSha,
      state: "success",
      context: "e2e/mcp",
      description: "MCP live test",
    });
    expect((status as { context: string }).context).toBe("e2e/mcp");
  });

  it("forgejo_list_commit_statuses", async () => {
    const statuses = (await tools.forgejo_list_commit_statuses.run({
      owner,
      repo: repo!,
      sha: commitSha,
    })) as { context: string }[];
    expect(statuses.some((s) => s.context === "e2e/mcp")).toBe(true);
  });

  it("forgejo_merge_pull_request", async () => {
    const result = (await tools.forgejo_merge_pull_request.run({
      owner,
      repo: repo!,
      index: prIndex,
      merge_style: "merge",
    })) as { merged?: boolean };
    expect(result.merged).toBe(true);
    const pr = (await tools.forgejo_get_pull_request.run({
      owner,
      repo: repo!,
      index: prIndex,
    })) as { merged: boolean };
    expect(pr.merged).toBe(true);
  });

  it("forgejo_close_issue", async () => {
    const closed = (await tools.forgejo_close_issue.run({
      owner,
      repo: repo!,
      index: issueIndex,
    })) as { state: string };
    expect(closed.state).toBe("closed");
  });
});
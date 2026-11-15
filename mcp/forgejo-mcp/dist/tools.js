import { z } from "zod";
const ownerRepo = z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
});
export function registerToolHandlers(client) {
    return {
        forgejo_list_pull_requests: {
            schema: ownerRepo.extend({
                state: z.enum(["open", "closed", "all"]).optional(),
                page: z.number().int().positive().optional(),
                limit: z.number().int().positive().max(100).optional(),
            }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, "/pulls"), { state: args.state ?? "open", page: args.page ?? 1, limit: args.limit ?? 30 });
            },
        },
        forgejo_get_pull_request: {
            schema: ownerRepo.extend({ index: z.number().int().positive() }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, `/pulls/${args.index}`));
            },
        },
        forgejo_create_pull_request: {
            schema: ownerRepo.extend({
                title: z.string().min(1),
                head: z.string().min(1),
                base: z.string().min(1),
                body: z.string().optional(),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, "/pulls"), {
                    title: args.title,
                    head: args.head,
                    base: args.base,
                    body: args.body ?? "",
                });
            },
        },
        forgejo_update_pull_request: {
            schema: ownerRepo.extend({
                index: z.number().int().positive(),
                title: z.string().optional(),
                body: z.string().optional(),
                state: z.enum(["open", "closed"]).optional(),
            }),
            run: async (args) => {
                const body = {};
                if (args.title !== undefined)
                    body.title = args.title;
                if (args.body !== undefined)
                    body.body = args.body;
                if (args.state !== undefined)
                    body.state = args.state;
                return client.patch(client.repoPath(args.owner, args.repo, `/pulls/${args.index}`), body);
            },
        },
        forgejo_pull_request_diff: {
            schema: ownerRepo.extend({ index: z.number().int().positive() }),
            run: async (args) => {
                const diff = await client.getText(client.repoPath(args.owner, args.repo, `/pulls/${args.index}.diff`));
                return { diff };
            },
        },
        forgejo_pull_request_files: {
            schema: ownerRepo.extend({ index: z.number().int().positive() }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, `/pulls/${args.index}/files`));
            },
        },
        forgejo_list_pull_review_comments: {
            schema: ownerRepo.extend({ index: z.number().int().positive() }),
            run: async (args) => {
                const reviews = await client.get(client.repoPath(args.owner, args.repo, `/pulls/${args.index}/reviews`));
                const issueComments = await client.get(client.repoPath(args.owner, args.repo, `/issues/${args.index}/comments`));
                return { reviews, issueComments };
            },
        },
        forgejo_create_pull_review: {
            schema: ownerRepo.extend({
                index: z.number().int().positive(),
                body: z.string().min(1),
                event: z.enum(["COMMENT", "APPROVE", "REQUEST_CHANGES"]).optional(),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, `/pulls/${args.index}/reviews`), {
                    body: args.body,
                    event: args.event ?? "COMMENT",
                });
            },
        },
        forgejo_merge_pull_request: {
            schema: ownerRepo.extend({
                index: z.number().int().positive(),
                merge_style: z.enum(["merge", "rebase", "squash"]).optional(),
                title: z.string().optional(),
            }),
            run: async (args) => {
                const body = {
                    Do: args.merge_style ?? "merge",
                };
                if (args.title)
                    body.title = args.title;
                const result = await client.post(client.repoPath(args.owner, args.repo, `/pulls/${args.index}/merge`), body);
                return result ?? { merged: true };
            },
        },
        forgejo_list_issues: {
            schema: ownerRepo.extend({
                state: z.enum(["open", "closed", "all"]).optional(),
                page: z.number().int().positive().optional(),
                limit: z.number().int().positive().max(100).optional(),
            }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, "/issues"), {
                    state: args.state ?? "open",
                    page: args.page ?? 1,
                    limit: args.limit ?? 30,
                });
            },
        },
        forgejo_get_issue: {
            schema: ownerRepo.extend({ index: z.number().int().positive() }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, `/issues/${args.index}`));
            },
        },
        forgejo_create_issue: {
            schema: ownerRepo.extend({
                title: z.string().min(1),
                body: z.string().optional(),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, "/issues"), {
                    title: args.title,
                    body: args.body ?? "",
                });
            },
        },
        forgejo_create_issue_comment: {
            schema: ownerRepo.extend({
                index: z.number().int().positive(),
                body: z.string().min(1),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, `/issues/${args.index}/comments`), { body: args.body });
            },
        },
        forgejo_close_issue: {
            schema: ownerRepo.extend({ index: z.number().int().positive() }),
            run: async (args) => {
                return client.patch(client.repoPath(args.owner, args.repo, `/issues/${args.index}`), { state: "closed" });
            },
        },
        forgejo_add_issue_labels: {
            schema: ownerRepo.extend({
                index: z.number().int().positive(),
                labels: z.array(z.string().min(1)).min(1),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, `/issues/${args.index}/labels`), { labels: args.labels });
            },
        },
        forgejo_list_labels: {
            schema: ownerRepo.extend({ page: z.number().int().positive().optional() }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, "/labels"), {
                    page: args.page ?? 1,
                    limit: 50,
                });
            },
        },
        forgejo_create_label: {
            schema: ownerRepo.extend({
                name: z.string().min(1),
                color: z.string().min(6).max(6),
                description: z.string().optional(),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, "/labels"), {
                    name: args.name,
                    color: args.color.replace(/^#/, ""),
                    description: args.description ?? "",
                });
            },
        },
        forgejo_add_pull_request_labels: {
            schema: ownerRepo.extend({
                index: z.number().int().positive(),
                labels: z.array(z.string().min(1)).min(1),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, `/issues/${args.index}/labels`), { labels: args.labels });
            },
        },
        forgejo_list_commit_statuses: {
            schema: ownerRepo.extend({ sha: z.string().min(7) }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, `/statuses/${args.sha}`));
            },
        },
        forgejo_create_commit_status: {
            schema: ownerRepo.extend({
                sha: z.string().min(7),
                state: z.enum(["pending", "success", "error", "failure", "warning"]),
                context: z.string().min(1),
                description: z.string().optional(),
                target_url: z.string().url().optional(),
            }),
            run: async (args) => {
                return client.post(client.repoPath(args.owner, args.repo, `/statuses/${args.sha}`), {
                    state: args.state,
                    context: args.context,
                    description: args.description ?? "",
                    target_url: args.target_url ?? "",
                });
            },
        },
        forgejo_list_branches: {
            schema: ownerRepo.extend({ page: z.number().int().positive().optional() }),
            run: async (args) => {
                return client.get(client.repoPath(args.owner, args.repo, "/branches"), {
                    page: args.page ?? 1,
                    limit: 50,
                });
            },
        },
        forgejo_get_file_contents: {
            schema: ownerRepo.extend({
                path: z.string().min(1),
                ref: z.string().optional(),
            }),
            run: async (args) => {
                const q = {};
                if (args.ref)
                    q.ref = args.ref;
                const raw = await client.get(client.repoPath(args.owner, args.repo, `/contents/${args.path.split("/").map(encodeURIComponent).join("/")}`), q);
                if (raw?.content && raw.encoding === "base64") {
                    return {
                        ...raw,
                        decoded: Buffer.from(raw.content, "base64").toString("utf8"),
                    };
                }
                return raw;
            },
        },
    };
}

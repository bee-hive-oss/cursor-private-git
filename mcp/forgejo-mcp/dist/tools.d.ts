import { z } from "zod";
import type { ForgejoClient } from "./client.js";
declare const ownerRepo: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
}, {
    owner: string;
    repo: string;
}>;
export declare function registerToolHandlers(client: ForgejoClient): {
    forgejo_list_pull_requests: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            state: z.ZodOptional<z.ZodEnum<["open", "closed", "all"]>>;
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            state?: "open" | "closed" | "all" | undefined;
            page?: number | undefined;
            limit?: number | undefined;
        }, {
            owner: string;
            repo: string;
            state?: "open" | "closed" | "all" | undefined;
            page?: number | undefined;
            limit?: number | undefined;
        }>;
        run: (args: z.infer<typeof ownerRepo> & {
            state?: string;
            page?: number;
            limit?: number;
        }) => Promise<unknown>;
    };
    forgejo_get_pull_request: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
        }, {
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
        }) => Promise<unknown>;
    };
    forgejo_create_pull_request: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            title: z.ZodString;
            head: z.ZodString;
            base: z.ZodString;
            body: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            title: string;
            head: string;
            base: string;
            body?: string | undefined;
        }, {
            owner: string;
            repo: string;
            title: string;
            head: string;
            base: string;
            body?: string | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            title: string;
            head: string;
            base: string;
            body?: string;
        }) => Promise<unknown>;
    };
    forgejo_update_pull_request: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
            title: z.ZodOptional<z.ZodString>;
            body: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodEnum<["open", "closed"]>>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
            body?: string | undefined;
            state?: "open" | "closed" | undefined;
            title?: string | undefined;
        }, {
            owner: string;
            repo: string;
            index: number;
            body?: string | undefined;
            state?: "open" | "closed" | undefined;
            title?: string | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
            title?: string;
            body?: string;
            state?: string;
        }) => Promise<unknown>;
    };
    forgejo_pull_request_diff: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
        }, {
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
        }) => Promise<{
            diff: string;
        }>;
    };
    forgejo_pull_request_files: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
        }, {
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
        }) => Promise<unknown>;
    };
    forgejo_list_pull_review_comments: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
        }, {
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
        }) => Promise<{
            reviews: unknown[];
            issueComments: unknown[];
        }>;
    };
    forgejo_create_pull_review: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
            body: z.ZodString;
            event: z.ZodOptional<z.ZodEnum<["COMMENT", "APPROVE", "REQUEST_CHANGES"]>>;
        }, "strip", z.ZodTypeAny, {
            body: string;
            owner: string;
            repo: string;
            index: number;
            event?: "COMMENT" | "APPROVE" | "REQUEST_CHANGES" | undefined;
        }, {
            body: string;
            owner: string;
            repo: string;
            index: number;
            event?: "COMMENT" | "APPROVE" | "REQUEST_CHANGES" | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
            body: string;
            event?: string;
        }) => Promise<unknown>;
    };
    forgejo_merge_pull_request: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
            merge_style: z.ZodOptional<z.ZodEnum<["merge", "rebase", "squash"]>>;
            title: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
            title?: string | undefined;
            merge_style?: "merge" | "rebase" | "squash" | undefined;
        }, {
            owner: string;
            repo: string;
            index: number;
            title?: string | undefined;
            merge_style?: "merge" | "rebase" | "squash" | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
            merge_style?: string;
            title?: string;
        }) => Promise<{
            merged?: boolean;
        }>;
    };
    forgejo_list_issues: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            state: z.ZodOptional<z.ZodEnum<["open", "closed", "all"]>>;
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            state?: "open" | "closed" | "all" | undefined;
            page?: number | undefined;
            limit?: number | undefined;
        }, {
            owner: string;
            repo: string;
            state?: "open" | "closed" | "all" | undefined;
            page?: number | undefined;
            limit?: number | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            state?: string;
            page?: number;
            limit?: number;
        }) => Promise<unknown>;
    };
    forgejo_get_issue: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
        }, {
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
        }) => Promise<unknown>;
    };
    forgejo_create_issue: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            title: z.ZodString;
            body: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            title: string;
            body?: string | undefined;
        }, {
            owner: string;
            repo: string;
            title: string;
            body?: string | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            title: string;
            body?: string;
        }) => Promise<unknown>;
    };
    forgejo_create_issue_comment: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
            body: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            body: string;
            owner: string;
            repo: string;
            index: number;
        }, {
            body: string;
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
            body: string;
        }) => Promise<unknown>;
    };
    forgejo_close_issue: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
        }, {
            owner: string;
            repo: string;
            index: number;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
        }) => Promise<unknown>;
    };
    forgejo_add_issue_labels: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
            labels: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
            labels: string[];
        }, {
            owner: string;
            repo: string;
            index: number;
            labels: string[];
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
            labels: string[];
        }) => Promise<unknown>;
    };
    forgejo_list_labels: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            page: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            page?: number | undefined;
        }, {
            owner: string;
            repo: string;
            page?: number | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            page?: number;
        }) => Promise<unknown>;
    };
    forgejo_create_label: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            name: z.ZodString;
            color: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            name: string;
            color: string;
            description?: string | undefined;
        }, {
            owner: string;
            repo: string;
            name: string;
            color: string;
            description?: string | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            name: string;
            color: string;
            description?: string;
        }) => Promise<unknown>;
    };
    forgejo_add_pull_request_labels: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            index: z.ZodNumber;
            labels: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            index: number;
            labels: string[];
        }, {
            owner: string;
            repo: string;
            index: number;
            labels: string[];
        }>;
        run: (args: {
            owner: string;
            repo: string;
            index: number;
            labels: string[];
        }) => Promise<unknown>;
    };
    forgejo_list_commit_statuses: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            sha: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            sha: string;
        }, {
            owner: string;
            repo: string;
            sha: string;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            sha: string;
        }) => Promise<unknown>;
    };
    forgejo_create_commit_status: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            sha: z.ZodString;
            state: z.ZodEnum<["pending", "success", "error", "failure", "warning"]>;
            context: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            target_url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            state: "pending" | "success" | "error" | "failure" | "warning";
            sha: string;
            context: string;
            description?: string | undefined;
            target_url?: string | undefined;
        }, {
            owner: string;
            repo: string;
            state: "pending" | "success" | "error" | "failure" | "warning";
            sha: string;
            context: string;
            description?: string | undefined;
            target_url?: string | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            sha: string;
            state: string;
            context: string;
            description?: string;
            target_url?: string;
        }) => Promise<unknown>;
    };
    forgejo_list_branches: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            page: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            page?: number | undefined;
        }, {
            owner: string;
            repo: string;
            page?: number | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            page?: number;
        }) => Promise<unknown>;
    };
    forgejo_get_file_contents: {
        schema: z.ZodObject<{
            owner: z.ZodString;
            repo: z.ZodString;
        } & {
            path: z.ZodString;
            ref: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            owner: string;
            repo: string;
            path: string;
            ref?: string | undefined;
        }, {
            owner: string;
            repo: string;
            path: string;
            ref?: string | undefined;
        }>;
        run: (args: {
            owner: string;
            repo: string;
            path: string;
            ref?: string;
        }) => Promise<{
            content?: string;
            encoding?: string;
            type?: string;
        } | {
            decoded: string;
            content?: string;
            encoding?: string;
            type?: string;
        }>;
    };
};
export type ToolName = keyof ReturnType<typeof registerToolHandlers>;
export {};

/** Trim whitespace and stray newlines from pasted Cursor secrets (matches agent-git-setup). */
export declare function trimForgejoEnvValue(value: string | undefined): string | undefined;
export declare function trimForgejoProcessEnv(): void;
export declare function loadConfigFromEnv(): {
    baseUrl: string;
    token: string;
    accessClientId?: string;
    accessClientSecret?: string;
};

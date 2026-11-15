const FORGEJO_ENV_NAMES = [
    "FORGEJO_URL",
    "FORGEJO_TOKEN",
    "FORGEJO_CF_ACCESS_CLIENT_ID",
    "FORGEJO_CF_ACCESS_CLIENT_SECRET",
];
/** Trim whitespace and stray newlines from pasted Cursor secrets (matches agent-git-setup). */
export function trimForgejoEnvValue(value) {
    if (value === undefined)
        return undefined;
    let val = value;
    val = val.replace(/^\s+|\s+$/g, "");
    val = val.replace(/\r/g, "").replace(/\n/g, "");
    return val;
}
export function trimForgejoProcessEnv() {
    for (const name of FORGEJO_ENV_NAMES) {
        const trimmed = trimForgejoEnvValue(process.env[name]);
        if (trimmed !== undefined) {
            process.env[name] = trimmed;
        }
    }
}
export function loadConfigFromEnv() {
    trimForgejoProcessEnv();
    const baseUrl = process.env.FORGEJO_URL;
    const token = process.env.FORGEJO_TOKEN;
    if (!baseUrl || !token) {
        throw new Error("FORGEJO_URL and FORGEJO_TOKEN must be set (values are never logged).");
    }
    const accessClientId = trimForgejoEnvValue(process.env.FORGEJO_CF_ACCESS_CLIENT_ID);
    const accessClientSecret = trimForgejoEnvValue(process.env.FORGEJO_CF_ACCESS_CLIENT_SECRET);
    return {
        baseUrl,
        token,
        accessClientId,
        accessClientSecret,
    };
}

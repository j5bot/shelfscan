    // the extension only replies once BGG answers; give up before WebMCP's own 30 s limit
export const EXTENSION_TIMEOUT_MS = 25_000;

/** Rejects if the extension hasn't replied within `ms`. */
export const withExtensionTimeout = <T>(promise: Promise<T>, ms = EXTENSION_TIMEOUT_MS) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`No response from the ShelfScan extension after ${ms / 1000} s`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

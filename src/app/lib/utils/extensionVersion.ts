// the extension shows its version as e.g. `v0.12.0 (1a2b3c4)`
export const EXTENSION_VERSION_PATTERN = /^v(?<version>\S+) \((?<hash>[^)]+)\)$/;

// first extension version that answers 'doSearch' messages
export const DO_SEARCH_MIN_EXTENSION_VERSION = '0.12.0';

export type ExtensionVersion = {
    version: string;
    major: number;
    minor: number;
    patch: number;
    hash?: string;
};

const toSegment = (segment: string | undefined) => {
    const number = parseInt(segment ?? '', 10);
    return Number.isNaN(number) ? 0 : number;
};

/** Parses `1.2.3` (missing or non-numeric segments count as 0). */
export const parseVersion = (version: string): ExtensionVersion => {
    const [major, minor, patch] = version.trim().split('.');
    return { version: version.trim(), major: toSegment(major), minor: toSegment(minor), patch: toSegment(patch) };
};

/** Parses the extension's version text, e.g. `v0.12.0 (1a2b3c4)`; undefined when it doesn't match. */
export const parseExtensionVersion = (text: string): ExtensionVersion | undefined => {
    const groups = text.trim().match(EXTENSION_VERSION_PATTERN)?.groups;
    if (!groups?.version) {
        return undefined;
    }
    return { ...parseVersion(groups.version), hash: groups.hash };
};

/** Negative when `a` is older than `b`, positive when newer, 0 when equal. */
export const compareVersions = (a: string | ExtensionVersion, b: string | ExtensionVersion): number => {
    const left = typeof a === 'string' ? parseVersion(a) : a;
    const right = typeof b === 'string' ? parseVersion(b) : b;
    return (left.major - right.major) || (left.minor - right.minor) || (left.patch - right.patch);
};

export const isVersionAtLeast = (version: string | ExtensionVersion, minimum: string | ExtensionVersion) =>
    compareVersions(version, minimum) >= 0;

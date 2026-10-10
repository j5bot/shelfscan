import { describe, it, expect } from '../setup';
import {
    compareVersions,
    DO_SEARCH_MIN_EXTENSION_VERSION,
    isVersionAtLeast,
    parseExtensionVersion,
    parseVersion,
} from '@/app/lib/utils/extensionVersion';

describe('parseExtensionVersion', () => {
    it('parses the version text the extension shows', () => {
        expect(parseExtensionVersion(' v0.12.3 (1a2b3c4) ')).toEqual({
            version: '0.12.3',
            major: 0,
            minor: 12,
            patch: 3,
            hash: '1a2b3c4',
        });
    });

    it('is undefined for other text', () => {
        expect(parseExtensionVersion('0.12.3')).toBeUndefined();
        expect(parseExtensionVersion('')).toBeUndefined();
    });
});

describe('parseVersion', () => {
    it('counts missing or non-numeric segments as 0', () => {
        expect(parseVersion('1.2')).toMatchObject({ major: 1, minor: 2, patch: 0 });
        expect(parseVersion('1.x.3')).toMatchObject({ major: 1, minor: 0, patch: 3 });
    });
});

describe('compareVersions', () => {
    it('compares numerically, segment by segment', () => {
        expect(compareVersions('0.12.0', '0.9.9')).toBeGreaterThan(0);
        expect(compareVersions('0.11.9', '0.12.0')).toBeLessThan(0);
        expect(compareVersions('1.0.0', '0.99.99')).toBeGreaterThan(0);
        expect(compareVersions('0.12.0', '0.12.0')).toBe(0);
    });
});

describe('isVersionAtLeast', () => {
    it('accepts the minimum doSearch version and newer', () => {
        expect(isVersionAtLeast('0.12.0', DO_SEARCH_MIN_EXTENSION_VERSION)).toBe(true);
        expect(isVersionAtLeast('0.12.1', DO_SEARCH_MIN_EXTENSION_VERSION)).toBe(true);
        expect(isVersionAtLeast('1.0.0', DO_SEARCH_MIN_EXTENSION_VERSION)).toBe(true);
    });

    it('rejects older versions', () => {
        expect(isVersionAtLeast('0.11.0', DO_SEARCH_MIN_EXTENSION_VERSION)).toBe(false);
        expect(isVersionAtLeast('0.9.9', DO_SEARCH_MIN_EXTENSION_VERSION)).toBe(false);
    });

    it('accepts parsed versions', () => {
        const parsed = parseExtensionVersion('v0.12.0 (abc)')!;
        expect(isVersionAtLeast(parsed, DO_SEARCH_MIN_EXTENSION_VERSION)).toBe(true);
    });
});

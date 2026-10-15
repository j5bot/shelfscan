import { describe, it, expect } from '../setup';
import { type BggCollectionItem } from '@/app/lib/types/bgg';
import {
    getScannedVersions,
    resolveCurrentVersionIndex,
    resolveDisplayVersion,
} from '@/app/lib/utils/versionSelection';
import { type GameUPCBggVersion, type GameUPCData } from 'gameupc-hooks/types';

const version = (version_id: number, name = `Version ${version_id}`) =>
    ({ version_id, name, published: 2020, language: 'English' }) as GameUPCBggVersion;
const versions = [version(10), version(20), version(30)];

describe('resolveCurrentVersionIndex', () => {
    it("selects the item's own version", () => {
        expect(resolveCurrentVersionIndex(versions, 20, undefined)).toBe(1);
    });

    it('selects nothing without an item version or a click', () => {
        expect(resolveCurrentVersionIndex(versions, undefined, undefined)).toBeNull();
        expect(resolveCurrentVersionIndex(versions, 99, undefined)).toBeNull();
    });

    it('keeps a click made against the same versions and item version', () => {
        const selection = { index: 2, versions, versionId: 20 };
        expect(resolveCurrentVersionIndex(versions, 20, selection)).toBe(2);
    });

    it("selects the item's version again once the item's version changes", () => {
        const selection = { index: 2, versions, versionId: 20 };
        expect(resolveCurrentVersionIndex(versions, 10, selection)).toBe(0);
    });

    it("selects the item's version again once the versions change", () => {
        const selection = { index: 2, versions: [...versions], versionId: 20 };
        expect(resolveCurrentVersionIndex(versions, 20, selection)).toBe(1);
    });

    it("keeps a click when the item's version isn't in the list", () => {
        const selection = { index: 2, versions: [...versions], versionId: undefined };
        expect(resolveCurrentVersionIndex(versions, undefined, selection)).toBe(2);
    });
});

describe('resolveDisplayVersion', () => {
    const item = { objectId: 1, name: 'Game' } as BggCollectionItem;

    it("shows the item's own version", () => {
        const withVersion = {
            ...item,
            version: { id: 77, name: 'Own', image: undefined, languages: undefined, productCode: undefined, yearPublished: 2019, publisher: undefined },
        };
        expect(resolveDisplayVersion(withVersion, versions, 1)?.versionId).toBe(77);
    });

    it('shows the selected version, else none', () => {
        expect(resolveDisplayVersion(item, versions, 2)?.versionId).toBe(30);
        expect(resolveDisplayVersion(item, versions, null)).toBeUndefined();
    });
});

describe('getScannedVersions', () => {
    const gameDataMap = {
        '0123': { bgg_info: [{ id: 1, versions: [version(10)] }, { id: 2, versions: [version(20)] }] },
    } as unknown as Record<string, GameUPCData>;
    const upcMap = new Map([[2, '0123']]);

    it("returns the scanned game's versions", () => {
        expect(getScannedVersions({ objectId: 2, upcMap, gameDataMap })?.map(v => v.version_id)).toEqual([20]);
    });

    it('is undefined when the game was not scanned or has no GameUPC data', () => {
        expect(getScannedVersions({ objectId: 3, upcMap, gameDataMap })).toBeUndefined();
        expect(getScannedVersions({ objectId: undefined, upcMap, gameDataMap })).toBeUndefined();
        expect(getScannedVersions({ objectId: 2, upcMap, gameDataMap: {} })).toBeUndefined();
    });
});

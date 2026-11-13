import { describe, it, expect } from '../setup';
import { BggCollectionItem, BggCollectionStatuses } from '@/app/lib/types/bgg';
import { getCollectionSortFields, sortCollection } from '@/app/lib/utils/collectionSort';
import { getScannedSets } from '@/app/lib/utils/scanSets';
import { SCAN_HISTORY_SCHEMA_VERSION, ScanHistoryEntry, ScanHistoryMatchStatus } from '@/app/lib/types/scanHistory';

const makeItem = (objectId: number, overrides: Partial<BggCollectionItem> = {}): BggCollectionItem => ({
    objectId,
    collectionId: 1000 + objectId,
    subType: 'boardgame',
    name: `Game ${objectId}`,
    image: undefined,
    thumbnail: undefined,
    yearPublished: undefined,
    lastModified: '',
    statuses: {} as BggCollectionStatuses,
    ...overrides,
});

const names = (items: BggCollectionItem[]) => items.map(item => item.name);

describe('sortCollection with the collection sort fields', () => {
    const lastScannedMap = new Map([[2, 300], [3, 100]]);
    const sortFields = getCollectionSortFields(lastScannedMap);

    const items = [
        makeItem(1, { name: 'Cascadia', rating: 7, averageRating: 7.9, plays: 2, yearPublished: 2021,
            lastModified: '2024-03-01 10:00:00' }),
        makeItem(2, { name: 'Ark Nova', rating: 9, averageRating: 8.5, yearPublished: 2021,
            lastModified: '', acquisitiondate: '2023-05-01' }),
        makeItem(3, { name: 'Brass', averageRating: 8.6, plays: 10, yearPublished: 2018,
            lastModified: '2022-01-01 10:00:00' }),
    ];

    it('sorts by name both ways', () => {
        expect(names(sortCollection(items, 'name', 'asc', sortFields))).toEqual(['Ark Nova', 'Brass', 'Cascadia']);
        expect(names(sortCollection(items, 'name', 'desc', sortFields))).toEqual(['Cascadia', 'Brass', 'Ark Nova']);
    });

    it('sorts a missing user rating as 0', () => {
        expect(names(sortCollection(items, 'rating', 'desc', sortFields))).toEqual(['Ark Nova', 'Cascadia', 'Brass']);
    });

    it('sorts by average rating', () => {
        expect(names(sortCollection(items, 'averageRating', 'asc', sortFields)))
            .toEqual(['Cascadia', 'Ark Nova', 'Brass']);
    });

    it('sorts missing plays as 0', () => {
        expect(names(sortCollection(items, 'plays', 'asc', sortFields))).toEqual(['Ark Nova', 'Cascadia', 'Brass']);
    });

    it('falls back to the acquisition date when there is no modified date', () => {
        expect(names(sortCollection(items, 'lastModified', 'asc', sortFields)))
            .toEqual(['Brass', 'Ark Nova', 'Cascadia']);
    });

    it('sorts by last scan, with never-scanned items first ascending', () => {
        expect(names(sortCollection(items, 'dateLastScanned', 'asc', sortFields)))
            .toEqual(['Cascadia', 'Brass', 'Ark Nova']);
    });

    it('sorts by year', () => {
        expect(names(sortCollection(items, 'yearPublished', 'asc', sortFields))[0]).toBe('Brass');
    });

    it('returns a copy and leaves the input order alone', () => {
        const before = names(items);
        const sorted = sortCollection(items, 'name', 'asc', sortFields);
        expect(sorted).not.toBe(items);
        expect(names(items)).toEqual(before);
    });

    it('leaves the order unchanged for an unknown field', () => {
        expect(sortCollection(items, 'nope' as 'name', 'asc', sortFields)).toBe(items);
    });
});

describe('getScannedSets', () => {
    const entry = (bggId: number | undefined, verified: boolean): ScanHistoryEntry => ({
        upc: '000000000000',
        timestamp: 0,
        updatedAt: 0,
        status: ScanHistoryMatchStatus.matched,
        verified,
        schemaVersion: SCAN_HISTORY_SCHEMA_VERSION,
        bggId,
    });

    it('collects scanned and verified BGG ids, skipping unmatched scans', () => {
        const { scannedSet, verifiedSet } = getScannedSets([
            entry(1, false),
            entry(2, true),
            entry(undefined, true),
            entry(1, true),
        ]);
        expect([...scannedSet].sort()).toEqual([1, 2]);
        expect([...verifiedSet].sort()).toEqual([1, 2]);
    });

    it('does not mark an id verified from unverified scans', () => {
        const { verifiedSet } = getScannedSets([entry(3, false)]);
        expect(verifiedSet.size).toBe(0);
    });
});

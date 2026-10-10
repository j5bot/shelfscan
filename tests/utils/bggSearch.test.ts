import { describe, it, expect } from '../setup';
import { BggExtensionSearchItem, BggSearchResult } from '@/app/lib/types/bgg';
import {
    getBggSearchQuery,
    isBggSearchQueryLongEnough,
    matchCollectionObjects,
    normalizeExtensionSearchItems,
    prepareExtensionSearchResults,
    prepareXmlSearchResults,
    sortBggSearchResults,
} from '@/app/lib/utils/bggSearch';

const result = (
    objectId: number,
    name: string,
    subType: BggSearchResult['subType'] = 'boardgame',
    yearPublished?: number,
): BggSearchResult => ({ objectId, name, subType, yearPublished, source: 'xmlapi' });

const extensionItem = (overrides: Partial<BggExtensionSearchItem>): BggExtensionSearchItem => ({
    objectid: '822',
    subtype: 'boardgame',
    primaryname: '1',
    yearpublished: 2000,
    rep_imageid: 8621446,
    name: 'Carcassonne',
    ...overrides,
});

describe('getBggSearchQuery', () => {
    it('uses the whole text in all mode without prefixes', () => {
        expect(getBggSearchQuery('Carcassonne', 'all')).toBe('carcassonne');
    });

    it('uses the text before the first prefix in all mode', () => {
        expect(getBggSearchQuery('carc version:2nd', 'all')).toBe('carc');
    });

    it('uses the name: value in all mode', () => {
        expect(getBggSearchQuery('version:2nd name:heat', 'all')).toBe('heat');
    });

    it('has no query for version-only or tag-only searches in all mode', () => {
        expect(getBggSearchQuery('version:2nd', 'all')).toBe('');
        expect(getBggSearchQuery('tags:#pnp', 'all')).toBe('');
        expect(getBggSearchQuery('#pnp', 'all')).toBe('');
    });

    it('uses the text in name mode', () => {
        expect(getBggSearchQuery('  Heat  ', 'name')).toBe('heat');
    });

    it('has no query in version and tags modes', () => {
        expect(getBggSearchQuery('2nd edition', 'version')).toBe('');
        expect(getBggSearchQuery('#pnp', 'tags')).toBe('');
    });

    it('strips plain and negated hashtags and collapses whitespace', () => {
        expect(getBggSearchQuery('carc  #owned   !#sleeved  hunters', 'all')).toBe('carc hunters');
    });

    it('is empty for blank text', () => {
        expect(getBggSearchQuery('   ', 'all')).toBe('');
    });
});

describe('isBggSearchQueryLongEnough', () => {
    it('needs at least 3 characters', () => {
        expect(isBggSearchQueryLongEnough('ca')).toBe(false);
        expect(isBggSearchQueryLongEnough('car')).toBe(true);
    });
});

describe('normalizeExtensionSearchItems', () => {
    it('converts ids, years and image ids to numbers', () => {
        expect(normalizeExtensionSearchItems([extensionItem({})])).toEqual([{
            objectId: 822,
            name: 'Carcassonne',
            subType: 'boardgame',
            yearPublished: 2000,
            imageId: 8621446,
            source: 'extension',
        }]);
    });

    it('keeps only board games and expansions', () => {
        const results = normalizeExtensionSearchItems([
            extensionItem({ objectid: '1', subtype: 'boardgameaccessory' }),
            extensionItem({ objectid: '2', subtype: 'rpgitem' }),
            extensionItem({ objectid: '3', subtype: 'boardgameexpansion' }),
        ]);
        expect(results.map(r => r.objectId)).toEqual([3]);
    });

    it('drops items without a valid id or name', () => {
        const results = normalizeExtensionSearchItems([
            extensionItem({ objectid: 'abc' }),
            extensionItem({ objectid: '0' }),
            extensionItem({ objectid: '-4' }),
            extensionItem({ objectid: '5', name: '  ' }),
            extensionItem({ objectid: undefined }),
        ]);
        expect(results).toEqual([]);
    });

    it('treats missing, zero and null years as unknown', () => {
        const results = normalizeExtensionSearchItems([
            extensionItem({ objectid: '1', yearpublished: undefined }),
            extensionItem({ objectid: '2', yearpublished: 0 }),
            extensionItem({ objectid: '3', yearpublished: null }),
            extensionItem({ objectid: '4', yearpublished: '1995' }),
        ]);
        expect(results.map(r => r.yearPublished)).toEqual([undefined, undefined, undefined, 1995]);
    });

    it('keeps the extension order', () => {
        const results = normalizeExtensionSearchItems([
            extensionItem({ objectid: '3', yearpublished: 1990 }),
            extensionItem({ objectid: '1', subtype: 'boardgameexpansion', yearpublished: 2020 }),
            extensionItem({ objectid: '2', yearpublished: 2010 }),
        ]);
        expect(results.map(r => r.objectId)).toEqual([3, 1, 2]);
    });

    it('keeps a game matched by several names once, at its first position, under its primary name', () => {
        const results = normalizeExtensionSearchItems([
            extensionItem({ objectid: '822', primaryname: '0', name: 'Carcassonne: Die Burg' }),
            extensionItem({ objectid: '9', name: 'Other' }),
            extensionItem({ objectid: '822', primaryname: '1', name: 'Carcassonne' }),
        ]);
        expect(results.map(r => [r.objectId, r.name])).toEqual([[822, 'Carcassonne'], [9, 'Other']]);
    });
});

describe('sortBggSearchResults', () => {
    it('puts board games before expansions, each newest first, unknown years last', () => {
        const sorted = sortBggSearchResults([
            result(1, 'Exp Old', 'boardgameexpansion', 2001),
            result(2, 'Game Unknown'),
            result(3, 'Game Old', 'boardgame', 2000),
            result(4, 'Exp New', 'boardgameexpansion', 2020),
            result(5, 'Game New', 'boardgame', 2019),
            result(6, 'Exp Unknown', 'boardgameexpansion'),
        ]);
        expect(sorted.map(r => r.objectId)).toEqual([5, 3, 2, 4, 1, 6]);
    });

    it('orders the same year by name, then id', () => {
        const sorted = sortBggSearchResults([
            result(3, 'B', 'boardgame', 2000),
            result(2, 'A', 'boardgame', 2000),
            result(1, 'B', 'boardgame', 2000),
        ]);
        expect(sorted.map(r => r.objectId)).toEqual([2, 1, 3]);
    });

    it('does not change its input', () => {
        const input = [result(1, 'A', 'boardgame', 1990), result(2, 'B', 'boardgame', 2000)];
        sortBggSearchResults(input);
        expect(input.map(r => r.objectId)).toEqual([1, 2]);
    });
});

describe('matchCollectionObjects', () => {
    it('adds the collection items for games in the collection, and none for others', () => {
        const { entries, hiddenByFilters } = matchCollectionObjects(
            [result(1, 'Owned'), result(2, 'Not owned')],
            { objects: { 1: [100, 101] } },
        );
        expect(entries.map(r => [r.objectId, r.collectionIds])).toEqual([[1, [100, 101]], [2, []]]);
        expect(hiddenByFilters).toBe(0);
    });

    it('keeps only the collection items the filters show', () => {
        const { entries } = matchCollectionObjects(
            [result(1, 'Two copies')],
            { objects: { 1: [100, 101] }, isShown: id => id === 101 },
        );
        expect(entries.map(r => r.collectionIds)).toEqual([[101]]);
    });

    it('drops and counts games whose collection items are all hidden by the filters', () => {
        const { entries, hiddenByFilters } = matchCollectionObjects(
            [result(1, 'Hidden'), result(2, 'Not owned'), result(3, 'Also hidden')],
            { objects: { 1: [100], 3: [300] }, isShown: () => false },
        );
        expect(entries.map(r => r.objectId)).toEqual([2]);
        expect(hiddenByFilters).toBe(2);
    });
});

describe('prepareXmlSearchResults', () => {
    it('sorts, matches to the collection and caps, counting the results that can be shown', () => {
        const prepared = prepareXmlSearchResults(
            [
                result(1, 'Old', 'boardgame', 1990),
                result(2, 'New', 'boardgame', 2020),
                result(3, 'Exp', 'boardgameexpansion', 2021),
                result(4, 'Hidden', 'boardgame', 2021),
            ],
            { objects: { 1: [100], 4: [400] }, isShown: id => id !== 400 },
            2,
        );
        expect(prepared.total).toBe(3);
        expect(prepared.hiddenByFilters).toBe(1);
        expect(prepared.results.map(r => [r.objectId, r.collectionIds])).toEqual([[2, []], [1, [100]]]);
    });

    it('caps at 100 by default', () => {
        const many = Array.from({ length: 150 }, (_, index) => result(index + 1, `Game ${index}`));
        const prepared = prepareXmlSearchResults(many, { objects: {} });
        expect(prepared.results).toHaveLength(100);
        expect(prepared.total).toBe(150);
    });
});

describe('prepareExtensionSearchResults', () => {
    it('keeps the extension order and matches to the collection', () => {
        const prepared = prepareExtensionSearchResults(
            [
                extensionItem({ objectid: '2', yearpublished: 1990 }),
                extensionItem({ objectid: '3' }),
                extensionItem({ objectid: '1' }),
            ],
            { objects: { 1: [100], 3: [300] }, isShown: id => id !== 300 },
        );
        expect(prepared.total).toBe(2);
        expect(prepared.hiddenByFilters).toBe(1);
        expect(prepared.results.map(r => [r.objectId, r.collectionIds])).toEqual([[2, []], [1, [100]]]);
    });
});

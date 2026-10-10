import { describe, it, expect } from '../../setup.js';
import { vi } from 'vitest';
import { bggGetSearchResultsFromXML } from '@/app/lib/services/bgg/service';

// Mock Dexie-backed cache so the service module loads cleanly
vi.mock('@/app/lib/database/cacheDatabase', () => ({
    getResponseFromCache: vi.fn().mockResolvedValue(undefined),
}));

const item = (id: number, type: string, name: string, year?: number, nameType = 'primary') =>
    `<item type="${type}" id="${id}"><name type="${nameType}" value="${name}"/>`
    + (year === undefined ? '' : `<yearpublished value="${year}"/>`)
    + '</item>';

const searchXml = (...items: string[]) =>
    `<?xml version="1.0" encoding="utf-8"?><items total="${items.length}" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">${items.join('')}</items>`;

describe('bggGetSearchResultsFromXML', () => {
    it('reads id, name, type and year', () => {
        expect(bggGetSearchResultsFromXML(searchXml(item(822, 'boardgame', 'Carcassonne', 2000)))).toEqual([{
            objectId: 822,
            name: 'Carcassonne',
            subType: 'boardgame',
            yearPublished: 2000,
            source: 'xmlapi',
        }]);
    });

    it('keeps an expansion listed as both boardgame and boardgameexpansion once, as an expansion', () => {
        const results = bggGetSearchResultsFromXML(searchXml(
            item(2, 'boardgame', 'Carcassonne: Inns &amp; Cathedrals', 2002),
            item(822, 'boardgame', 'Carcassonne', 2000),
            item(2, 'boardgameexpansion', 'Carcassonne: Inns &amp; Cathedrals', 2002),
        ));
        expect(results.map(r => [r.objectId, r.subType])).toEqual([[2, 'boardgameexpansion'], [822, 'boardgame']]);
    });

    it('prefers the primary name of a game listed more than once', () => {
        const results = bggGetSearchResultsFromXML(searchXml(
            item(822, 'boardgame', 'Carcassonne: Die Burg', 2000, 'alternate'),
            item(822, 'boardgameexpansion', 'Carcassonne', 2000),
        ));
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Carcassonne');
    });

    it('keeps an alternate name when that is all there is', () => {
        const results = bggGetSearchResultsFromXML(searchXml(item(822, 'boardgame', 'Carcassonne: Die Burg', 2000, 'alternate')));
        expect(results[0].name).toBe('Carcassonne: Die Burg');
    });

    it('treats a missing or zero year as unknown', () => {
        const results = bggGetSearchResultsFromXML(searchXml(
            item(1, 'boardgame', 'No Year'),
            item(2, 'boardgame', 'Zero Year', 0),
        ));
        expect(results.map(r => r.yearPublished)).toEqual([undefined, undefined]);
    });

    it('ignores other types', () => {
        expect(bggGetSearchResultsFromXML(searchXml(item(1, 'boardgameaccessory', 'Sleeves', 2010)))).toEqual([]);
    });

    it('decodes entities in names', () => {
        const results = bggGetSearchResultsFromXML(searchXml(item(1, 'boardgame', 'Kingdoms &amp; Castles', 2010)));
        expect(results[0].name).toBe('Kingdoms & Castles');
    });

    it('returns no results for an empty search', () => {
        expect(bggGetSearchResultsFromXML(searchXml())).toEqual([]);
    });

    it('throws on a BGG error', () => {
        expect(() => bggGetSearchResultsFromXML('<error><message>Rate limit exceeded.</message></error>'))
            .toThrow('Rate limit exceeded.');
    });

    it('throws on an empty or unexpected response', () => {
        expect(() => bggGetSearchResultsFromXML('')).toThrow();
        expect(() => bggGetSearchResultsFromXML('<html><body>oops</body></html>')).toThrow();
    });
});

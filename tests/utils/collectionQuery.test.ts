import { describe, it, expect } from '../setup';
import { BggCollectionItem, BggCollectionStatuses } from '@/app/lib/types/bgg';
import { DEFAULT_FILTERS } from '@/app/lib/utils/collectionFilters';
import {
    CollectionQueryContext,
    CollectionQueryInput,
    CollectionQueryResult,
    describeCollectionQueryResult,
    fromCollectionFilters,
    runCollectionQuery,
    toCollectionFilters,
} from '@/app/lib/utils/collectionQuery';

type ItemOverrides = Omit<Partial<BggCollectionItem>, 'statuses'> & { statuses?: Partial<BggCollectionStatuses> };

const makeItem = (objectId: number, name: string, overrides: ItemOverrides = {}): BggCollectionItem => {
    const { statuses, ...rest } = overrides;
    return {
        objectId,
        collectionId: 1000 + objectId,
        subType: 'boardgame',
        name,
        image: undefined,
        thumbnail: undefined,
        yearPublished: 2020,
        lastModified: '',
        statuses: { ...statuses } as BggCollectionStatuses,
        ...rest,
    };
};

const ARK = makeItem(1, 'Ark Nova', { statuses: { own: true }, minPlayers: 1, maxPlayers: 4, maxPlayTime: 150,
    rating: 9, plays: 12, yearPublished: 2021 });
const CASCADIA = makeItem(2, 'Cascadia', { statuses: { own: true, fortrade: true }, minPlayers: 1, maxPlayers: 4,
    maxPlayTime: 45, plays: 3 });
const BRASS = makeItem(3, 'Brass', { statuses: { own: true }, minPlayers: 2, maxPlayers: 4, maxPlayTime: 120 });
const PATCHWORK = makeItem(4, 'Patchwork', { statuses: { own: true }, minPlayers: 2, maxPlayers: 2, maxPlayTime: 30 });
const OLD_SAVE = makeItem(5, 'Azul', { statuses: { own: true } }); // stored before player counts were parsed
const WISHED = makeItem(6, 'Spirit Island', { statuses: { wishlist: true }, wishlistPriority: 2,
    minPlayers: 1, maxPlayers: 4 });
const EXPANSION = makeItem(7, 'Ark Nova: Marine Worlds', { subType: 'boardgameexpansion',
    statuses: { own: true }, minPlayers: 1, maxPlayers: 4 });

const ITEMS = [ARK, CASCADIA, BRASS, PATCHWORK, OLD_SAVE, WISHED, EXPANSION];

const CONTEXT: CollectionQueryContext = {
    scannedSet: new Set([ARK.objectId]),
    verifiedSet: new Set(),
    tagMap: { '#solo': [ARK.collectionId, CASCADIA.collectionId], '#sleeved': [ARK.collectionId] },
    tagsByItem: { [ARK.collectionId]: ['#solo', '#sleeved'], [CASCADIA.collectionId]: ['#solo'] },
    lastScannedMap: new Map(),
};

const query = (input: object) => runCollectionQuery(ITEMS, CollectionQueryInput.parse(input), CONTEXT);
const names = (result: CollectionQueryResult) => result.items.map(item => item.name);

describe('toCollectionFilters', () => {
    it('leaves everything at the defaults for empty input', () => {
        expect(toCollectionFilters({})).toEqual({ filters: DEFAULT_FILTERS, subType: undefined });
    });

    it('maps status filters and the subtype', () => {
        const { filters, subType } = toCollectionFilters({
            ownership: 'own', trade: 'fortrade', scan: 'scanned', subType: 'boardgame',
        });
        expect(filters).toMatchObject({ ownership: 'own', trade: 'fortrade', scan: 'scanned' });
        expect(subType).toBe('boardgame');
    });

    it('converts number filters to the strings the page stores', () => {
        const { filters } = toCollectionFilters({
            players: 2, maxPlayTime: 60,
            rating: { rated: true, source: 'average', min: 7.5 },
            plays: { played: true, max: 5 },
        });
        expect(filters).toMatchObject({
            players: '2', maxPlayTime: '60',
            rating: 'rated', ratingSource: 'average', ratingMin: '7.5', ratingMax: '',
            plays: 'played', playsMin: '', playsMax: '5',
        });
    });

    it('drops ranges for "not rated" and "not played"', () => {
        const { filters } = toCollectionFilters({ rating: { rated: false, min: 5 }, plays: { played: false, min: 1 } });
        expect(filters).toMatchObject({ rating: 'notrated', ratingMin: '', plays: 'notplayed', playsMin: '' });
    });

    it('treats a wishlist priority as implying the wishlist', () => {
        expect(toCollectionFilters({ wishlistPriority: 2 }).filters)
            .toMatchObject({ wishlist: 'wishlist', wishlistPriority: '2' });
        expect(toCollectionFilters({ wishlist: 'notwishlist', wishlistPriority: 2 }).filters.wishlist)
            .toBe('notwishlist');
    });

    describe('tags', () => {
        const search = (input: Parameters<typeof toCollectionFilters>[0]) => {
            const { searchText, searchMode } = toCollectionFilters(input).filters;
            return { searchText, searchMode };
        };

        it('become a tags: search on their own, adding a # where missing', () => {
            expect(search({ tags: ['solo', '#sleeved', '!pnp'] }))
                .toEqual({ searchText: 'tags: #solo #sleeved !#pnp', searchMode: 'all' });
        });

        it('are appended in tags mode', () => {
            expect(search({ search: { text: '#a', mode: 'tags' }, tags: ['b'] }))
                .toEqual({ searchText: '#a #b', searchMode: 'tags' });
        });

        it('keep a name or version search as a prefix', () => {
            expect(search({ search: { text: 'ark', mode: 'name' }, tags: ['solo'] }))
                .toEqual({ searchText: 'name: ark tags: #solo', searchMode: 'all' });
            expect(search({ search: { text: 'deluxe', mode: 'version' }, tags: ['solo'] }))
                .toEqual({ searchText: 'version: deluxe tags: #solo', searchMode: 'all' });
        });

        it('follow plain all-mode text', () => {
            expect(search({ search: { text: 'ark' }, tags: ['solo'] }))
                .toEqual({ searchText: 'ark tags: #solo', searchMode: 'all' });
        });

        it('are ignored when blank', () => {
            expect(search({ tags: ['#', '!'] })).toEqual({ searchText: '', searchMode: 'all' });
        });
    });
});

describe('fromCollectionFilters', () => {
    it('is empty for the defaults', () => {
        expect(fromCollectionFilters(DEFAULT_FILTERS)).toEqual({});
    });

    it('round-trips agent input', () => {
        const input = {
            ownership: 'own',
            wishlist: 'wishlist',
            wishlistPriority: 3,
            rating: { rated: true, source: 'user', min: 6, max: 9.5 },
            plays: { played: true, min: 1 },
            players: 3,
            maxPlayTime: 90,
            search: { text: 'ark', mode: 'name' },
            subType: 'boardgameexpansion',
        } as const;
        const { filters, subType } = toCollectionFilters(input);
        expect(fromCollectionFilters(filters, subType)).toEqual(input);
    });

    it('leaves out a priority without a wishlist filter, like the page does', () => {
        expect(fromCollectionFilters({ ...DEFAULT_FILTERS, wishlistPriority: '2' })).toEqual({});
    });
});

describe('runCollectionQuery', () => {
    it('answers "how many games do I own that play with 2 players?"', () => {
        const result = query({ ownership: 'own', subType: 'boardgame', players: 2, limit: 0 });
        expect(result.total).toBe(4);
        expect(result.games).toBe(4);
        expect(result.expansions).toBe(0);
        expect(result.items).toEqual([]);
        // Azul is owned but was saved without player counts
        expect(result.missingPlayerData).toBe(1);
    });

    it('only reports missing data for the filters in use', () => {
        const result = query({ ownership: 'own' });
        expect(result.missingPlayerData).toBeUndefined();
        expect(result.missingPlayTimeData).toBeUndefined();
    });

    it('reports items left out for lacking a play time', () => {
        const result = query({ maxPlayTime: 60 });
        expect(names(result)).toEqual(['Cascadia', 'Patchwork']);
        // Azul, Spirit Island and the expansion have no play time
        expect(result.missingPlayTimeData).toBe(3);
    });

    it('counts statuses across the matched items only', () => {
        const result = query({ ownership: 'own', subType: 'boardgame' });
        expect(result.statuses.own).toBe(5);
        expect(result.statuses.fortrade).toBe(1);
        expect(result.statuses.wishlist).toBe(0);
    });

    it('sorts by name by default, and by any sort field either way', () => {
        expect(names(query({ ownership: 'own', subType: 'boardgame' })))
            .toEqual(['Ark Nova', 'Azul', 'Brass', 'Cascadia', 'Patchwork']);
        expect(names(query({ plays: { played: true }, sort: { field: 'plays', direction: 'desc' } })))
            .toEqual(['Ark Nova', 'Cascadia']);
    });

    it('pages with limit and offset', () => {
        const first = query({ subType: 'boardgame', limit: 2 });
        expect(names(first)).toEqual(['Ark Nova', 'Azul']);
        expect(first.hasMore).toBe(true);

        const last = query({ subType: 'boardgame', limit: 2, offset: 4 });
        expect(names(last)).toEqual(['Patchwork', 'Spirit Island']);
        expect(last.hasMore).toBe(false);

        expect(query({ subType: 'boardgame', offset: 50 }).items).toEqual([]);
    });

    it('defaults to 25 items', () => {
        const many = Array.from({ length: 30 }, (_, i) => makeItem(100 + i, `Game ${String(i).padStart(2, '0')}`));
        const result = runCollectionQuery(many, {}, CONTEXT);
        expect(result.items).toHaveLength(25);
        expect(result.limit).toBe(25);
        expect(result.hasMore).toBe(true);
    });

    it('rejects a limit over the maximum', () => {
        expect(() => CollectionQueryInput.parse({ limit: 500 })).toThrow();
    });

    it('returns only the base fields unless more are asked for', () => {
        const [item] = query({ search: { text: 'ark nova', mode: 'name' }, subType: 'boardgame' }).items;
        expect(item).toEqual({
            objectId: ARK.objectId, collectionId: ARK.collectionId, name: 'Ark Nova',
            yearPublished: 2021, subType: 'boardgame',
        });
    });

    it('adds the requested fields', () => {
        const [item] = query({
            search: { text: 'ark nova', mode: 'name' },
            subType: 'boardgame',
            fields: ['statuses', 'rating', 'plays', 'players', 'playTime', 'tags'],
        }).items;
        expect(item).toMatchObject({
            statuses: ['own'], rating: 9, plays: 12, minPlayers: 1, maxPlayers: 4, maxPlayTime: 150,
            tags: ['#solo', '#sleeved'],
        });
    });

    it('shows the wishlist priority with the statuses of a wishlisted item', () => {
        const [item] = query({ wishlist: 'wishlist', fields: ['statuses'] }).items;
        expect(item).toMatchObject({ statuses: ['wishlist'], wishlistPriority: 2 });
    });

    it('filters by tags and scans using the context', () => {
        expect(names(query({ tags: ['solo', '!sleeved'] }))).toEqual(['Cascadia']);
        expect(names(query({ scan: 'scanned' }))).toEqual(['Ark Nova']);
    });

    it('echoes the normalised filters and sort it applied', () => {
        const result = query({ tags: ['solo'], players: 2 });
        expect(result.appliedFilters).toEqual({ players: 2, search: { text: 'tags: #solo', mode: 'all' } });
        expect(result.sort).toEqual({ field: 'name', direction: 'asc' });
    });
});

describe('describeCollectionQueryResult', () => {
    it('leads with the count and the missing-data caveat', () => {
        const text = describeCollectionQueryResult(query({ ownership: 'own', subType: 'boardgame', players: 2, limit: 0 }));
        const [first, second] = text.split('\n');
        expect(first).toBe('4 matching items (4 games, 0 expansions).');
        expect(second).toContain('1 item lack player counts');
        expect(second).toContain('load_bgg_collection');
    });

    it('lists the page of items with ids and requested details', () => {
        const text = describeCollectionQueryResult(query({
            ownership: 'own', subType: 'boardgame', limit: 2, fields: ['players'],
        }));
        expect(text).toContain('Items 1–2 by name asc (more available — raise offset):');
        expect(text).toContain('- Ark Nova (2021) [bggId 1, collectionId 1001] — 1–4 players');
        expect(text).toContain('- Azul (2020) [bggId 5, collectionId 1005]');
    });

    it('says when an offset is past the end', () => {
        expect(describeCollectionQueryResult(query({ subType: 'boardgame', offset: 50 })))
            .toContain('No items at offset 50.');
    });
});

import { describe, it, expect } from '../setup';
import { BggCollectionItem, BggCollectionStatuses, BggTagMap, BggVersion } from '@/app/lib/types/bgg';
import {
    CollectionFilterContext,
    CollectionFilters,
    createCollectionFilterFn,
    DEFAULT_FILTERS,
    getPresetFilters,
    getLongestPlayTime,
    getSerializableFilters,
    hasActiveFilters,
    hasPlayerCountData,
} from '@/app/lib/utils/collectionFilters';

type ItemOverrides = Omit<Partial<BggCollectionItem>, 'statuses'> & { statuses?: Partial<BggCollectionStatuses> };

let nextId = 1;
const makeItem = (overrides: ItemOverrides = {}): BggCollectionItem => {
    const id = nextId++;
    const { statuses, ...rest } = overrides;
    return {
        objectId: id,
        collectionId: 1000 + id,
        subType: 'boardgame',
        name: `Game ${id}`,
        image: undefined,
        thumbnail: undefined,
        yearPublished: 2020,
        lastModified: '2024-01-01 00:00:00',
        statuses: { ...statuses } as BggCollectionStatuses,
        ...rest,
    };
};

const makeVersion = (id: number, name: string): BggVersion => ({
    id,
    name,
    image: undefined,
    languages: undefined,
    productCode: undefined,
    yearPublished: undefined,
} as BggVersion);

const EMPTY_CONTEXT: CollectionFilterContext = {
    scannedSet: new Set(),
    verifiedSet: new Set(),
    tagMap: {},
};

const matches = (
    filters: Partial<CollectionFilters>,
    items: BggCollectionItem[],
    context: CollectionFilterContext = EMPTY_CONTEXT,
) => items.filter(createCollectionFilterFn({ ...DEFAULT_FILTERS, ...filters }, context));

describe('createCollectionFilterFn', () => {
    it('keeps everything with the default filters', () => {
        const items = [makeItem(), makeItem({ statuses: { own: true } })];
        expect(matches({}, items)).toEqual(items);
    });

    describe('ownership', () => {
        const owned = makeItem({ statuses: { own: true } });
        const prev = makeItem({ statuses: { prevowned: true } });
        const wished = makeItem({ statuses: { wishlist: true } });
        const items = [owned, prev, wished];

        it('own', () => expect(matches({ ownership: 'own' }, items)).toEqual([owned]));
        it('prevowned', () => expect(matches({ ownership: 'prevowned' }, items)).toEqual([prev]));
        it('notowned excludes owned and previously owned', () =>
            expect(matches({ ownership: 'notowned' }, items)).toEqual([wished]));
    });

    describe('trade', () => {
        const forTrade = makeItem({ statuses: { fortrade: true } });
        const kept = makeItem();
        it('fortrade', () => expect(matches({ trade: 'fortrade' }, [forTrade, kept])).toEqual([forTrade]));
        it('nottrade', () => expect(matches({ trade: 'nottrade' }, [forTrade, kept])).toEqual([kept]));
    });

    describe('want', () => {
        const want = makeItem({ statuses: { want: true } });
        const toPlay = makeItem({ statuses: { wanttoplay: true } });
        const toBuy = makeItem({ statuses: { wanttobuy: true } });
        const items = [want, toPlay, toBuy];
        it('want', () => expect(matches({ want: 'want' }, items)).toEqual([want]));
        it('wanttoplay', () => expect(matches({ want: 'wanttoplay' }, items)).toEqual([toPlay]));
        it('wanttobuy', () => expect(matches({ want: 'wanttobuy' }, items)).toEqual([toBuy]));
    });

    describe('condition', () => {
        const withCondition = makeItem({ tradeCondition: 'Like new' });
        const without = makeItem();
        it('has', () => expect(matches({ condition: 'has' }, [withCondition, without])).toEqual([withCondition]));
        it('not', () => expect(matches({ condition: 'not' }, [withCondition, without])).toEqual([without]));
    });

    describe('version', () => {
        const versioned = makeItem({ version: makeVersion(5, 'English first edition') });
        const plain = makeItem();
        it('versioned', () => expect(matches({ version: 'versioned' }, [versioned, plain])).toEqual([versioned]));
        it('notversioned', () => expect(matches({ version: 'notversioned' }, [versioned, plain])).toEqual([plain]));
    });

    describe('wishlist and priority', () => {
        const p1 = makeItem({ statuses: { wishlist: true }, wishlistPriority: 1 });
        const p3 = makeItem({ statuses: { wishlist: true }, wishlistPriority: 3 });
        const notWished = makeItem();
        const items = [p1, p3, notWished];

        it('wishlist', () => expect(matches({ wishlist: 'wishlist' }, items)).toEqual([p1, p3]));
        it('notwishlist', () => expect(matches({ wishlist: 'notwishlist' }, items)).toEqual([notWished]));
        it('priority narrows a wishlist filter', () =>
            expect(matches({ wishlist: 'wishlist', wishlistPriority: '3' }, items)).toEqual([p3]));
        it('priority is ignored without a wishlist filter', () =>
            expect(matches({ wishlistPriority: '3' }, items)).toEqual(items));
    });

    describe('preorder', () => {
        const pre = makeItem({ statuses: { preordered: true } });
        const plain = makeItem();
        it('preordered', () => expect(matches({ preorder: 'preordered' }, [pre, plain])).toEqual([pre]));
        it('notpreordered', () => expect(matches({ preorder: 'notpreordered' }, [pre, plain])).toEqual([plain]));
    });

    describe('scan and verification', () => {
        const scanned = makeItem();
        const verified = makeItem();
        const neither = makeItem();
        const items = [scanned, verified, neither];
        const context: CollectionFilterContext = {
            ...EMPTY_CONTEXT,
            scannedSet: new Set([scanned.objectId, verified.objectId]),
            verifiedSet: new Set([verified.objectId]),
        };

        it('scanned', () => expect(matches({ scan: 'scanned' }, items, context)).toEqual([scanned, verified]));
        it('notscanned', () => expect(matches({ scan: 'notscanned' }, items, context)).toEqual([neither]));
        it('verified', () => expect(matches({ verification: 'verified' }, items, context)).toEqual([verified]));
        it('notverified', () =>
            expect(matches({ verification: 'notverified' }, items, context)).toEqual([scanned, neither]));
    });

    describe('rating', () => {
        const low = makeItem({ rating: 4, averageRating: 8.5 });
        const high = makeItem({ rating: 9, averageRating: 6 });
        const unrated = makeItem({ averageRating: 7 });
        const items = [low, high, unrated];

        it('rated', () => expect(matches({ rating: 'rated' }, items)).toEqual([low, high]));
        it('notrated', () => expect(matches({ rating: 'notrated' }, items)).toEqual([unrated]));
        it('applies a user rating range', () =>
            expect(matches({ rating: 'rated', ratingMin: '5', ratingMax: '10' }, items)).toEqual([high]));
        it('applies an average rating range', () =>
            expect(matches({ rating: 'rated', ratingSource: 'average', ratingMin: '7' }, items))
                .toEqual([low, unrated]));
        it('ignores an unparseable bound', () =>
            expect(matches({ rating: 'rated', ratingMin: 'abc' }, items)).toEqual([low, high]));
    });

    describe('plays', () => {
        const never = makeItem();
        const once = makeItem({ plays: 1 });
        const often = makeItem({ plays: 12 });
        const items = [never, once, often];

        it('played', () => expect(matches({ plays: 'played' }, items)).toEqual([once, often]));
        it('notplayed', () => expect(matches({ plays: 'notplayed' }, items)).toEqual([never]));
        it('applies a plays range', () =>
            expect(matches({ plays: 'played', playsMin: '2', playsMax: '20' }, items)).toEqual([often]));
        it('ignores the range unless played is set', () =>
            expect(matches({ playsMin: '2' }, items)).toEqual(items));
    });

    describe('search', () => {
        const ark = makeItem({ name: 'Ark Nova' });
        const arkDeluxe = makeItem({ name: 'Wingspan', version: makeVersion(9, 'Ark-themed deluxe') });
        const other = makeItem({ name: 'Cascadia' });
        const items = [ark, arkDeluxe, other];
        const tagMap: BggTagMap = {
            '#pnp': [ark.collectionId, other.collectionId],
            '#sleeved': [ark.collectionId],
        };
        const context: CollectionFilterContext = { ...EMPTY_CONTEXT, tagMap };

        it('all mode without prefixes matches name or version', () =>
            expect(matches({ searchText: 'ark' }, items)).toEqual([ark, arkDeluxe]));
        it('name mode matches names only', () =>
            expect(matches({ searchText: 'ark', searchMode: 'name' }, items)).toEqual([ark]));
        it('version mode matches versions only', () =>
            expect(matches({ searchText: 'deluxe', searchMode: 'version' }, items)).toEqual([arkDeluxe]));
        it('tags are AND-ed', () =>
            expect(matches({ searchText: '#pnp #sleeved', searchMode: 'tags' }, items, context)).toEqual([ark]));
        it('a `!` tag excludes items with the tag', () =>
            expect(matches({ searchText: '#pnp !#sleeved', searchMode: 'tags' }, items, context)).toEqual([other]));
        it('combines name and tags prefixes', () =>
            expect(matches({ searchText: 'name: cas tags: #pnp' }, items, context)).toEqual([other]));

        it('ignoreNameSearch drops the name part but keeps tags', () => {
            const filters = { ...DEFAULT_FILTERS, searchText: 'name: zzz tags: #pnp' };
            const fn = createCollectionFilterFn(filters, context, { ignoreNameSearch: true });
            expect(items.filter(fn)).toEqual([ark, other]);
        });

        it('ignoreNameSearch drops an all-mode text query', () => {
            const filters = { ...DEFAULT_FILTERS, searchText: 'zzz' };
            const fn = createCollectionFilterFn(filters, context, { ignoreNameSearch: true });
            expect(items.filter(fn)).toEqual(items);
        });
    });

    describe('players', () => {
        const solo = makeItem({ minPlayers: 1, maxPlayers: 1 });
        const twoToFour = makeItem({ minPlayers: 2, maxPlayers: 4 });
        const unknown = makeItem();
        const items = [solo, twoToFour, unknown];

        it('matches a count inside the range, including the ends', () => {
            expect(matches({ players: '2' }, items)).toEqual([twoToFour]);
            expect(matches({ players: '4' }, items)).toEqual([twoToFour]);
            expect(matches({ players: '1' }, items)).toEqual([solo]);
        });
        it('matches nothing outside every range', () => expect(matches({ players: '5' }, items)).toEqual([]));
        it('never matches items without player counts', () =>
            expect(matches({ players: '3' }, [unknown])).toEqual([]));
        it('is ignored when blank or unparseable', () => {
            expect(matches({ players: '' }, items)).toEqual(items);
            expect(matches({ players: 'x' }, items)).toEqual(items);
        });
    });

    describe('maxPlayTime', () => {
        const short = makeItem({ minPlayTime: 20, maxPlayTime: 30, playingTime: 30 });
        const long = makeItem({ minPlayTime: 60, maxPlayTime: 120, playingTime: 120 });
        const playingTimeOnly = makeItem({ playingTime: 45 });
        const unknown = makeItem();
        const items = [short, long, playingTimeOnly, unknown];

        it('keeps games whose longest time fits', () =>
            expect(matches({ maxPlayTime: '60' }, items)).toEqual([short, playingTimeOnly]));
        it('includes the boundary', () => expect(matches({ maxPlayTime: '120' }, items)).toEqual([short, long, playingTimeOnly]));
        it('never matches items without a play time', () =>
            expect(matches({ maxPlayTime: '999' }, [unknown])).toEqual([]));
    });

    it('combines filters with AND', () => {
        const match = makeItem({ statuses: { own: true, fortrade: true }, plays: 3 });
        const ownedOnly = makeItem({ statuses: { own: true }, plays: 3 });
        const unplayed = makeItem({ statuses: { own: true, fortrade: true } });
        expect(matches({ ownership: 'own', trade: 'fortrade', plays: 'played' }, [match, ownedOnly, unplayed]))
            .toEqual([match]);
    });
});

describe('play data helpers', () => {
    it('getLongestPlayTime prefers max, then playing, then min play time', () => {
        expect(getLongestPlayTime(makeItem({ minPlayTime: 10, maxPlayTime: 40, playingTime: 30 }))).toBe(40);
        expect(getLongestPlayTime(makeItem({ minPlayTime: 10, playingTime: 30 }))).toBe(30);
        expect(getLongestPlayTime(makeItem({ minPlayTime: 10 }))).toBe(10);
        expect(getLongestPlayTime(makeItem())).toBeUndefined();
    });

    it('hasPlayerCountData needs both ends of the range', () => {
        expect(hasPlayerCountData(makeItem({ minPlayers: 1, maxPlayers: 4 }))).toBe(true);
        expect(hasPlayerCountData(makeItem({ minPlayers: 1 }))).toBe(false);
        expect(hasPlayerCountData(makeItem())).toBe(false);
    });
});

describe('getSerializableFilters', () => {
    it('is empty for the defaults', () => {
        expect(getSerializableFilters(DEFAULT_FILTERS)).toEqual({});
    });

    it('keeps only filters that differ from the defaults', () => {
        expect(getSerializableFilters({ ...DEFAULT_FILTERS, ownership: 'own', searchText: 'ark' }))
            .toEqual({ ownership: 'own', searchText: 'ark' });
    });

    it('drops rating range and source unless rating is "rated"', () => {
        const filters = { ...DEFAULT_FILTERS, ratingMin: '5', ratingSource: 'average' as const };
        expect(getSerializableFilters(filters)).toEqual({});
        expect(getSerializableFilters({ ...filters, rating: 'rated' }))
            .toEqual({ rating: 'rated', ratingMin: '5', ratingSource: 'average' });
    });

    it('drops plays range unless plays is "played"', () => {
        const filters = { ...DEFAULT_FILTERS, playsMax: '4' };
        expect(getSerializableFilters(filters)).toEqual({});
        expect(getSerializableFilters({ ...filters, plays: 'played' })).toEqual({ plays: 'played', playsMax: '4' });
    });

    it('keeps players and maxPlayTime when set', () => {
        expect(getSerializableFilters({ ...DEFAULT_FILTERS, players: '2', maxPlayTime: '60' }))
            .toEqual({ players: '2', maxPlayTime: '60' });
    });

    it('drops wishlist priority without a wishlist filter', () => {
        const filters = { ...DEFAULT_FILTERS, wishlistPriority: '2' as const };
        expect(getSerializableFilters(filters)).toEqual({});
        expect(getSerializableFilters({ ...filters, wishlist: 'wishlist' }))
            .toEqual({ wishlist: 'wishlist', wishlistPriority: '2' });
    });
});

describe('getPresetFilters', () => {
    it('leaves out the search', () => {
        expect(getPresetFilters({ ...DEFAULT_FILTERS, ownership: 'own', searchText: 'ark', searchMode: 'name' }))
            .toEqual({ ownership: 'own' });
    });
});

describe('hasActiveFilters', () => {
    it('is false for the defaults', () => {
        expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    });

    it('is true for a status filter, a number filter or search text', () => {
        expect(hasActiveFilters({ ...DEFAULT_FILTERS, scan: 'scanned' })).toBe(true);
        expect(hasActiveFilters({ ...DEFAULT_FILTERS, players: '2' })).toBe(true);
        expect(hasActiveFilters({ ...DEFAULT_FILTERS, maxPlayTime: '45' })).toBe(true);
        expect(hasActiveFilters({ ...DEFAULT_FILTERS, searchText: 'x' })).toBe(true);
    });

    it('ignores the search mode and rating source on their own', () => {
        expect(hasActiveFilters({ ...DEFAULT_FILTERS, searchMode: 'tags', ratingSource: 'average' })).toBe(false);
    });
});

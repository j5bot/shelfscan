import { BggCollectionItem, BggItemTagMap, PossibleStatus, PossibleStatuses } from '@/app/lib/types/bgg';
import {
    CollectionFilterContext,
    CollectionFilters,
    createCollectionFilterFn,
    DEFAULT_FILTERS,
    getLongestPlayTime,
    hasPlayerCountData,
    SearchMode,
} from '@/app/lib/utils/collectionFilters';
import {
    AllGamesSortField,
    AllGamesSortFields,
    getCollectionSortFields,
    SortDirection,
    sortCollection,
} from '@/app/lib/utils/collectionSort';
import { BggCollectionSummary, summarizeCollection } from '@/app/lib/utils/collectionSummary';
import { z } from 'zod';

// ── Input schemas ──────────────────────────────────────────────────────────────

export const CollectionSubTypes = ['boardgame', 'boardgameexpansion'] as const;
export type CollectionSubType = typeof CollectionSubTypes[number];

/** Filters in the vocabulary agents use; each maps onto a `CollectionFilters` key. Omitted = no filter. */
export const CollectionFilterInput = z.object({
    ownership: z.enum(['own', 'prevowned', 'notowned']).optional()
        .describe('own: owned now. prevowned: previously owned. notowned: neither owned nor previously owned.'),
    trade: z.enum(['fortrade', 'nottrade']).optional()
        .describe('fortrade: marked for trade. nottrade: not marked for trade.'),
    want: z.enum(['want', 'wanttoplay', 'wanttobuy']).optional()
        .describe('want: wanted in trade. wanttoplay: want to play. wanttobuy: want to buy.'),
    wishlist: z.enum(['wishlist', 'notwishlist']).optional()
        .describe('wishlist: on the wishlist. notwishlist: not on the wishlist.'),
    wishlistPriority: z.number().int().min(1).max(5).optional()
        .describe('Wishlist priority: 1 Must Have, 2 Love to Have, 3 Like to Have, 4 Thinking About It, '
            + '5 Don\'t Buy This. Implies wishlist: "wishlist" when wishlist is not given.'),
    preorder: z.enum(['preordered', 'notpreordered']).optional()
        .describe('preordered: marked as preordered. notpreordered: not preordered.'),
    condition: z.enum(['has', 'not']).optional()
        .describe('has: the item has trade condition text. not: it has none.'),
    version: z.enum(['versioned', 'notversioned']).optional()
        .describe('versioned: a specific published version (edition) is set on the item. notversioned: none is set.'),
    scan: z.enum(['scanned', 'notscanned']).optional()
        .describe('scanned: the game\'s barcode has been scanned in ShelfScan. notscanned: never scanned.'),
    verification: z.enum(['verified', 'notverified']).optional()
        .describe('verified: a scan of the game was verified against GameUPC. notverified: no verified scan.'),
    rating: z.object({
        rated: z.boolean().describe('true: only rated items, optionally within min–max. false: only unrated items.'),
        source: z.enum(['user', 'average']).optional()
            .describe('user (default): the user\'s own rating. average: BGG\'s average rating.'),
        min: z.number().min(0).max(10).optional().describe('Lowest rating to include, 1–10.'),
        max: z.number().min(0).max(10).optional().describe('Highest rating to include, 1–10.'),
    }).optional().describe('Rating filter; the min/max range applies only when rated is true.'),
    plays: z.object({
        played: z.boolean().describe('true: logged at least one play, optionally within min–max. false: never played.'),
        min: z.number().int().min(0).optional().describe('Fewest logged plays to include.'),
        max: z.number().int().min(0).optional().describe('Most logged plays to include.'),
    }).optional().describe('Logged-plays filter; the min/max range applies only when played is true.'),
    players: z.number().int().min(1).optional()
        .describe('Only games that support this player count (BGG min players ≤ n ≤ max players). '
            + 'Items without player counts never match.'),
    maxPlayTime: z.number().int().min(1).optional()
        .describe('Only games whose longest stated play time is at most this many minutes. '
            + 'Items without a play time never match.'),
    search: z.object({
        text: z.string().describe('Case-insensitive text to look for.'),
        mode: z.enum(['all', 'name', 'version', 'tags']).optional()
            .describe('all (default): name or version name, or use "name:", "version:", "tags:" prefixes. '
                + 'name / version: that field only. tags: space-separated hashtags, AND-ed; "!tag" excludes.'),
    }).optional().describe('Text search, as typed in the collection search box.'),
    tags: z.array(z.string().min(1)).optional()
        .describe('Hashtags the item must carry (the # is optional); "!tag" means it must not. AND-ed and '
            + 'added to the search. With plain all-mode search text, that text then matches names only.'),
    subType: z.enum(CollectionSubTypes).optional()
        .describe('boardgame: base games only. boardgameexpansion: expansions only. Omit for both.'),
});

export type CollectionFilterInputValue = z.infer<typeof CollectionFilterInput>;

export const QueryItemFields =
    ['statuses', 'rating', 'plays', 'players', 'playTime', 'version', 'tags', 'tradeCondition', 'comment'] as const;
export type QueryItemField = typeof QueryItemFields[number];

export const DEFAULT_QUERY_LIMIT = 25;
export const MAX_QUERY_LIMIT = 200;

export const CollectionQueryInput = CollectionFilterInput.extend({
    sort: z.object({
        field: z.enum(AllGamesSortFields)
            .describe('name, lastModified (or acquisition date), dateLastScanned, yearPublished, rating '
                + '(the user\'s), averageRating (BGG\'s) or plays.'),
        direction: z.enum(['asc', 'desc']).optional().describe('asc (default) or desc.'),
    }).optional().describe('Order of the returned items. Defaults to name, ascending.'),
    limit: z.number().int().min(0).max(MAX_QUERY_LIMIT).optional()
        .describe(`How many items to return (default ${DEFAULT_QUERY_LIMIT}, max ${MAX_QUERY_LIMIT}). `
            + '0 returns only the counts.'),
    offset: z.number().int().min(0).optional().describe('How many matching items to skip, for paging.'),
    fields: z.array(z.enum(QueryItemFields)).optional()
        .describe('Extra details per item, beyond id, name, year and type: statuses, rating, plays, '
            + 'players (min/max), playTime, version, tags, tradeCondition, comment.'),
});

export type CollectionQueryInputValue = z.infer<typeof CollectionQueryInput>;

// ── Input ↔ CollectionFilters ──────────────────────────────────────────────────

export type ResolvedCollectionFilters = {
    filters: CollectionFilters;
    subType?: CollectionSubType;
};

const formatTag = (tag: string) => {
    const negate = tag.startsWith('!');
    const bare = (negate ? tag.slice(1) : tag).trim().replace(/^#/, '');
    return bare ? `${negate ? '!' : ''}#${bare}` : '';
};

/** The search box text and mode for a search plus extra required tags. */
const buildSearch = (
    search: CollectionFilterInputValue['search'],
    tags: string[] = [],
): Pick<CollectionFilters, 'searchText' | 'searchMode'> => {
    const text = search?.text.trim() ?? '';
    const mode: SearchMode = search?.mode ?? 'all';
    const tagText = tags.map(formatTag).filter(Boolean).join(' ');
    if (!tagText) {
        return { searchText: text, searchMode: text ? mode : 'all' };
    }

    switch (mode) {
        case 'tags':
            return { searchText: `${text} ${tagText}`.trim(), searchMode: 'tags' };
        case 'name':
        case 'version':
            return { searchText: text ? `${mode}: ${text} tags: ${tagText}` : `tags: ${tagText}`, searchMode: 'all' };
        default:
            return { searchText: text ? `${text} tags: ${tagText}` : `tags: ${tagText}`, searchMode: 'all' };
    }
};

const toBound = (value: number | undefined) =>
    value === undefined ? '' : String(value);

/** Converts agent input into the collection page's filter state. */
export const toCollectionFilters = (input: CollectionFilterInputValue): ResolvedCollectionFilters => {
    const filters: CollectionFilters = {
        ...DEFAULT_FILTERS,
        ...buildSearch(input.search, input.tags),
    };

    filters.ownership = input.ownership ?? 'default';
    filters.trade = input.trade ?? 'default';
    filters.want = input.want ?? 'default';
    filters.preorder = input.preorder ?? 'default';
    filters.condition = input.condition ?? 'default';
    filters.version = input.version ?? 'default';
    filters.scan = input.scan ?? 'default';
    filters.verification = input.verification ?? 'default';

    // a priority only filters alongside a wishlist filter, so it implies one
    const wishlist = input.wishlist ?? (input.wishlistPriority !== undefined ? 'wishlist' : undefined);
    filters.wishlist = wishlist ?? 'default';
    if (input.wishlistPriority !== undefined) {
        filters.wishlistPriority = String(input.wishlistPriority) as CollectionFilters['wishlistPriority'];
    }

    if (input.rating) {
        filters.rating = input.rating.rated ? 'rated' : 'notrated';
        if (input.rating.rated) {
            filters.ratingSource = input.rating.source ?? 'user';
            filters.ratingMin = toBound(input.rating.min);
            filters.ratingMax = toBound(input.rating.max);
        }
    }

    if (input.plays) {
        filters.plays = input.plays.played ? 'played' : 'notplayed';
        if (input.plays.played) {
            filters.playsMin = toBound(input.plays.min);
            filters.playsMax = toBound(input.plays.max);
        }
    }

    filters.players = toBound(input.players);
    filters.maxPlayTime = toBound(input.maxPlayTime);

    return { filters, subType: input.subType };
};

const toNumber = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
};

const toInteger = (value: string) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
};

const omitUndefined = <T extends Record<string, unknown>>(value: T) =>
    Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;

/** Converts the collection page's filter state into agent input; filters left at their defaults are omitted. */
export const fromCollectionFilters = (
    filters: CollectionFilters,
    subType?: CollectionSubType,
): CollectionFilterInputValue => {
    const pick = <K extends keyof CollectionFilters>(key: K) =>
        filters[key] === 'default' ? undefined : filters[key];

    const wishlistPriority = filters.wishlist !== 'default' && filters.wishlistPriority !== 'default'
        ? toInteger(filters.wishlistPriority)
        : undefined;

    let rating: CollectionFilterInputValue['rating'];
    if (filters.rating === 'notrated') {
        rating = { rated: false };
    } else if (filters.rating === 'rated') {
        rating = omitUndefined({
            rated: true,
            source: filters.ratingSource,
            min: toNumber(filters.ratingMin),
            max: toNumber(filters.ratingMax),
        });
    }

    let plays: CollectionFilterInputValue['plays'];
    if (filters.plays === 'notplayed') {
        plays = { played: false };
    } else if (filters.plays === 'played') {
        plays = omitUndefined({
            played: true,
            min: toInteger(filters.playsMin),
            max: toInteger(filters.playsMax),
        });
    }

    const searchText = filters.searchText.trim();
    const search = searchText ? { text: searchText, mode: filters.searchMode } : undefined;

    return omitUndefined({
        ownership: pick('ownership') as CollectionFilterInputValue['ownership'],
        trade: pick('trade') as CollectionFilterInputValue['trade'],
        want: pick('want') as CollectionFilterInputValue['want'],
        wishlist: pick('wishlist') as CollectionFilterInputValue['wishlist'],
        wishlistPriority,
        preorder: pick('preorder') as CollectionFilterInputValue['preorder'],
        condition: pick('condition') as CollectionFilterInputValue['condition'],
        version: pick('version') as CollectionFilterInputValue['version'],
        scan: pick('scan') as CollectionFilterInputValue['scan'],
        verification: pick('verification') as CollectionFilterInputValue['verification'],
        rating,
        plays,
        players: toInteger(filters.players),
        maxPlayTime: toInteger(filters.maxPlayTime),
        search,
        subType,
    });
};

// ── Running a query ────────────────────────────────────────────────────────────

export type CollectionQueryContext = CollectionFilterContext & {
    tagsByItem: BggItemTagMap;
    lastScannedMap: Map<number, number>;
};

export type CollectionQueryItem = {
    objectId: number;
    collectionId: number;
    name: string;
    yearPublished?: number;
    subType: string;
    statuses?: PossibleStatus[];
    wishlistPriority?: number;
    rating?: number;
    averageRating?: number;
    plays?: number;
    minPlayers?: number;
    maxPlayers?: number;
    minPlayTime?: number;
    maxPlayTime?: number;
    playingTime?: number;
    version?: { id: number; name?: string };
    tags?: string[];
    tradeCondition?: string;
    comment?: string;
};

export type CollectionQueryResult = BggCollectionSummary & {
    // items that pass every other filter but are left out because they lack player counts / a play time
    missingPlayerData?: number;
    missingPlayTimeData?: number;
    offset: number;
    limit: number;
    hasMore: boolean;
    sort: { field: AllGamesSortField; direction: SortDirection };
    appliedFilters: CollectionFilterInputValue;
    items: CollectionQueryItem[];
};

const toQueryItem = (
    item: BggCollectionItem,
    fields: Set<QueryItemField>,
    tagsByItem: BggItemTagMap,
): CollectionQueryItem => {
    const result: CollectionQueryItem = {
        objectId: item.objectId,
        collectionId: item.collectionId,
        name: item.name,
        yearPublished: item.yearPublished,
        subType: item.subType,
    };
    if (fields.has('statuses')) {
        result.statuses = PossibleStatuses.filter(status => item.statuses?.[status]);
        if (item.statuses?.wishlist) {
            result.wishlistPriority = item.wishlistPriority;
        }
    }
    if (fields.has('rating')) {
        result.rating = item.rating;
        result.averageRating = item.averageRating;
    }
    if (fields.has('plays')) {
        result.plays = item.plays ?? 0;
    }
    if (fields.has('players')) {
        result.minPlayers = item.minPlayers;
        result.maxPlayers = item.maxPlayers;
    }
    if (fields.has('playTime')) {
        result.minPlayTime = item.minPlayTime;
        result.maxPlayTime = item.maxPlayTime;
        result.playingTime = item.playingTime;
    }
    if (fields.has('version') && item.version?.id) {
        result.version = { id: item.version.id, name: item.version.name };
    }
    if (fields.has('tags')) {
        result.tags = tagsByItem[item.collectionId] ?? [];
    }
    if (fields.has('tradeCondition')) {
        result.tradeCondition = item.tradeCondition;
    }
    if (fields.has('comment')) {
        result.comment = item.comment;
    }
    return omitUndefined(result);
};

/** Counts the items that pass `filters` with the play filter cleared, but lack the data that filter needs. */
const countMissing = (
    items: BggCollectionItem[],
    filters: CollectionFilters,
    cleared: Partial<CollectionFilters>,
    context: CollectionFilterContext,
    subType: CollectionSubType | undefined,
    hasData: (item: BggCollectionItem) => boolean,
) => {
    const filterFn = createCollectionFilterFn({ ...filters, ...cleared }, context);
    return items.filter(item => !hasData(item) && (!subType || item.subType === subType) && filterFn(item)).length;
};

/** Filters, sorts, pages and summarises collection items, without touching any view state. */
export const runCollectionQuery = (
    items: BggCollectionItem[],
    input: CollectionQueryInputValue,
    context: CollectionQueryContext,
): CollectionQueryResult => {
    const { filters, subType } = toCollectionFilters(input);
    const filterFn = createCollectionFilterFn(filters, context);
    const matched = items.filter(item => (!subType || item.subType === subType) && filterFn(item));

    const sortField = input.sort?.field ?? 'name';
    const sortDirection = input.sort?.direction ?? 'asc';
    const sorted = sortCollection(matched, sortField, sortDirection, getCollectionSortFields(context.lastScannedMap));

    const offset = input.offset ?? 0;
    const limit = input.limit ?? DEFAULT_QUERY_LIMIT;
    const fields = new Set(input.fields ?? []);
    const page = sorted.slice(offset, offset + limit).map(item => toQueryItem(item, fields, context.tagsByItem));

    const missingPlayerData = filters.players === ''
        ? undefined
        : countMissing(items, filters, { players: '' }, context, subType, hasPlayerCountData);
    const missingPlayTimeData = filters.maxPlayTime === ''
        ? undefined
        : countMissing(items, filters, { maxPlayTime: '' }, context, subType,
            item => getLongestPlayTime(item) !== undefined);

    return omitUndefined({
        ...summarizeCollection(matched),
        missingPlayerData,
        missingPlayTimeData,
        offset,
        limit,
        hasMore: offset + limit < sorted.length,
        sort: { field: sortField, direction: sortDirection },
        appliedFilters: fromCollectionFilters(filters, subType),
        items: page,
    });
};

// ── Describing a result ────────────────────────────────────────────────────────

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

const describeItem = (item: CollectionQueryItem) => {
    const year = item.yearPublished ? ` (${item.yearPublished})` : '';
    const type = item.subType === 'boardgameexpansion' ? ', expansion' : '';
    const extras: string[] = [];
    if (item.statuses) {
        extras.push(`statuses: ${item.statuses.join(', ') || 'none'}`);
    }
    if (item.rating !== undefined || item.averageRating !== undefined) {
        extras.push(`rating ${item.rating ?? '–'} / avg ${item.averageRating?.toFixed(2) ?? '–'}`);
    }
    if (item.plays !== undefined) {
        extras.push(pluralize(item.plays, 'play'));
    }
    if (item.minPlayers !== undefined || item.maxPlayers !== undefined) {
        extras.push(`${item.minPlayers ?? '?'}–${item.maxPlayers ?? '?'} players`);
    }
    if (item.maxPlayTime !== undefined || item.playingTime !== undefined) {
        extras.push(`${item.minPlayTime ?? '?'}–${item.maxPlayTime ?? item.playingTime} min`);
    }
    if (item.version) {
        extras.push(`version: ${item.version.name ?? item.version.id}`);
    }
    if (item.tags?.length) {
        extras.push(`tags: ${item.tags.join(' ')}`);
    }
    if (item.tradeCondition) {
        extras.push(`condition: ${item.tradeCondition}`);
    }
    if (item.comment) {
        extras.push(`comment: ${item.comment}`);
    }
    const details = extras.length ? ` — ${extras.join('; ')}` : '';
    return `- ${item.name}${year}${type} [bggId ${item.objectId}, collectionId ${item.collectionId}]${details}`;
};

/** A short plain-text answer: the count first, then any missing-data caveat, then the page of items. */
export const describeCollectionQueryResult = (result: CollectionQueryResult) => {
    const lines = [
        `${pluralize(result.total, 'matching item')} (${pluralize(result.games, 'game')}, `
            + `${pluralize(result.expansions, 'expansion')}).`,
    ];

    const missing: string[] = [];
    if (result.missingPlayerData) {
        missing.push(`${pluralize(result.missingPlayerData, 'item')} lack player counts`);
    }
    if (result.missingPlayTimeData) {
        missing.push(`${pluralize(result.missingPlayTimeData, 'item')} lack a play time`);
    }
    if (missing.length) {
        lines.push(`Not counted: ${missing.join(' and ')}, so they couldn't be checked. `
            + 'Refresh the collection with load_bgg_collection to fill this in.');
    }

    if (result.items.length) {
        const first = result.offset + 1;
        const last = result.offset + result.items.length;
        const more = result.hasMore ? ' (more available — raise offset)' : '';
        lines.push(`Items ${first}–${last} by ${result.sort.field} ${result.sort.direction}${more}:`);
        lines.push(...result.items.map(describeItem));
    } else if (result.total > 0 && result.limit > 0) {
        lines.push(`No items at offset ${result.offset}.`);
    }

    return lines.join('\n');
};

import { ExtensionSearchResponseError } from '@/app/lib/extension/messaging/searchBgg';
import { ExtensionTimeoutError } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { parseUnifiedSearch, SearchMode } from '@/app/lib/hooks/useCollectionFilters';
import {
    BggCollectionId,
    BggCollectionObjectMap,
    BggExtensionSearchItem,
    BggSearchEntry,
    BggSearchResult,
    BggSearchSource,
    BggSearchSubType,
} from '@/app/lib/types/bgg';
import { HASHTAG_PATTERN } from '@/app/lib/utils/tags';

export const BGG_SEARCH_MIN_QUERY_LENGTH = 3;
export const BGG_SEARCH_MAX_RESULTS = 100;

const SEARCH_SUB_TYPES: ReadonlySet<string> = new Set<BggSearchSubType>(['boardgame', 'boardgameexpansion']);

// a hashtag, optionally negated (`!#sleeved`), as typed in the collection search box
const SEARCH_TAG_PATTERN = new RegExp(`!?${HASHTAG_PATTERN.source}`, 'g');

export type PreparedBggSearchResults = {
    results: BggSearchEntry[];
    // results that can be shown, before the cap
    total: number;
    // games in the collection that the search found but the filters hide
    hiddenByFilters: number;
};

/**
 * The text to search BGG for: the name part of the collection search, without tags. Empty when the search
 * has no name part (version or tag searches), since BGG search only matches names.
 */
export const getBggSearchQuery = (searchText: string, searchMode: SearchMode): string => {
    const { nameQuery, anyTextQuery } = parseUnifiedSearch(searchText, searchMode);
    return (anyTextQuery || nameQuery)
        .replace(SEARCH_TAG_PATTERN, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

export const isBggSearchQueryLongEnough = (query: string) => query.length >= BGG_SEARCH_MIN_QUERY_LENGTH;

const toPositiveInteger = (value: unknown): number | undefined => {
    const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return typeof number === 'number' && Number.isInteger(number) && number > 0 ? number : undefined;
};

/**
 * Board games and expansions from the extension's doSearch items, in the extension's (relevance) order. A game
 * matched by several of its names is kept once, at its first position, under its primary name when there is one.
 */
export const normalizeExtensionSearchItems = (items: BggExtensionSearchItem[]): BggSearchResult[] => {
    const byId = new Map<number, BggSearchResult>();
    const hasPrimaryName = new Set<number>();

    items.forEach(item => {
        const objectId = toPositiveInteger(item.objectid);
        const name = item.name?.trim();
        if (!objectId || !name || !SEARCH_SUB_TYPES.has(item.subtype ?? '')) {
            return;
        }
        const isPrimary = item.primaryname === '1';
        const existing = byId.get(objectId);
        if (existing) {
            if (isPrimary && !hasPrimaryName.has(objectId)) {
                existing.name = name;
                hasPrimaryName.add(objectId);
            }
            return;
        }
        if (isPrimary) {
            hasPrimaryName.add(objectId);
        }
        byId.set(objectId, {
            objectId,
            name,
            subType: item.subtype as BggSearchSubType,
            yearPublished: toPositiveInteger(item.yearpublished),
            imageId: toPositiveInteger(item.rep_imageid),
            source: 'extension',
        });
    });

    return [...byId.values()];
};

const SUB_TYPE_ORDER: Record<BggSearchSubType, number> = { boardgame: 0, boardgameexpansion: 1 };

/** Board games before expansions; each newest first, unknown years last, then by name and id. */
export const sortBggSearchResults = (results: BggSearchResult[]): BggSearchResult[] =>
    [...results].sort((a, b) => {
        switch (true) {
            case a.subType !== b.subType:
                return SUB_TYPE_ORDER[a.subType] - SUB_TYPE_ORDER[b.subType];
            case a.yearPublished !== b.yearPublished:
                return (b.yearPublished ?? -Infinity) - (a.yearPublished ?? -Infinity);
            case a.name !== b.name:
                return a.name.localeCompare(b.name);
            default:
                return a.objectId - b.objectId;
        }
    });

/** The user's collection, for matching search results to it. */
export type CollectionMatch = {
    objects: BggCollectionObjectMap;
    // whether the collection's filters (other than the search text) show the item; all shown when omitted
    isShown?: (collectionId: BggCollectionId) => boolean;
};

/**
 * Pairs each result with the user's collection items for the same game (any status) that the filters show, so a
 * game found by title can be shown as its collection item(s) in place of the search result. A game whose items
 * are all hidden by the filters is dropped and counted as hidden.
 */
export const matchCollectionObjects = (
    results: BggSearchResult[],
    collection: CollectionMatch,
): { entries: BggSearchEntry[]; hiddenByFilters: number } => {
    const { objects, isShown = () => true } = collection;
    const entries: BggSearchEntry[] = [];
    let hiddenByFilters = 0;

    results.forEach(result => {
        const collectionIds = objects[result.objectId] ?? [];
        const shownIds = collectionIds.filter(isShown);
        if (collectionIds.length > 0 && shownIds.length === 0) {
            hiddenByFilters++;
            return;
        }
        entries.push({ ...result, collectionIds: shownIds });
    });

    return { entries, hiddenByFilters };
};

/** XML API results to show: sorted, matched to the collection, capped. */
export const prepareXmlSearchResults = (
    results: BggSearchResult[],
    collection: CollectionMatch,
    max = BGG_SEARCH_MAX_RESULTS,
): PreparedBggSearchResults => {
    const { entries, hiddenByFilters } = matchCollectionObjects(sortBggSearchResults(results), collection);
    return { results: entries.slice(0, max), total: entries.length, hiddenByFilters };
};

/** Extension results to show: in the extension's order (it sends at most 20), matched to the collection. */
export const prepareExtensionSearchResults = (
    results: BggSearchResult[],
    collection: CollectionMatch,
): PreparedBggSearchResults => {
    const { entries, hiddenByFilters } = matchCollectionObjects(results, collection);
    return { results: entries, total: entries.length, hiddenByFilters };
};

/** Search results to show, prepared the way their source needs (R6). */
export const prepareBggSearchResults = (
    results: BggSearchResult[],
    source: BggSearchSource,
    collection: CollectionMatch,
): PreparedBggSearchResults => source === 'extension'
    ? prepareExtensionSearchResults(results, collection)
    : prepareXmlSearchResults(results, collection);

export type BggSearchErrorReason = 'timeout' | 'error' | 'bad_response';

export class BggSearchError extends Error {
    name = 'BggSearchError';
    readonly reason: BggSearchErrorReason;
    readonly source: BggSearchSource;

    constructor(reason: BggSearchErrorReason, source: BggSearchSource, message: string) {
        super(message);
        this.reason = reason;
        this.source = source;
    }
}

export const getBggSearchErrorReason = (error: unknown): BggSearchErrorReason => {
    switch (true) {
        case error instanceof BggSearchError:
            return error.reason;
        case error instanceof ExtensionTimeoutError:
            return 'timeout';
        case error instanceof ExtensionSearchResponseError:
            return 'bad_response';
        default:
            return 'error';
    }
};

export type BggSearchOutcome = {
    source: BggSearchSource;
    results: BggSearchResult[];
    // the extension was tried and failed
    fallback: boolean;
};

export type RunBggSearchParams = {
    query: string;
    useExtension: boolean;
    searchExtension: (query: string) => Promise<BggExtensionSearchItem[]>;
    // throws a BggSearchError on failure
    searchXml: (query: string) => Promise<BggSearchResult[]>;
    onExtensionError?: (reason: BggSearchErrorReason, error: unknown) => void;
};

/**
 * Searches through the extension when it can, falling back to the XML API when it fails (timeout, error, not
 * logged in, no items). A successful extension search is final, even when empty. Throws a BggSearchError when
 * the XML API search fails.
 */
export const runBggSearch = async (params: RunBggSearchParams): Promise<BggSearchOutcome> => {
    const { query, useExtension, searchExtension, searchXml, onExtensionError } = params;

    if (useExtension) {
        try {
            const items = await searchExtension(query);
            return { source: 'extension', results: normalizeExtensionSearchItems(items), fallback: false };
        } catch (error) {
            onExtensionError?.(getBggSearchErrorReason(error), error);
        }
    }

    try {
        return { source: 'xmlapi', results: await searchXml(query), fallback: useExtension };
    } catch (error) {
        throw error instanceof BggSearchError
              ? error
              : new BggSearchError('error', 'xmlapi', error instanceof Error ? error.message : String(error));
    }
};

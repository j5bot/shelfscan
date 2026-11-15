import { BggCollectionItem, BggTagMap } from '@/app/lib/types/bgg';

// ── Filter types ───────────────────────────────────────────────────────────────

export type OwnershipFilter = 'default' | 'own' | 'prevowned' | 'notowned';
export type TradeFilter = 'default' | 'fortrade' | 'nottrade';
export type WantFilter = 'default' | 'want' | 'wanttoplay' | 'wanttobuy';
export type ConditionFilter = 'default' | 'has' | 'not';
export type VersionFilter = 'default' | 'versioned' | 'notversioned';
export type WishlistFilter = 'default' | 'wishlist' | 'notwishlist';
export type WishlistPriorityFilter = 'default' | '1' | '2' | '3' | '4' | '5';
export type PreorderFilter = 'default' | 'preordered' | 'notpreordered';
export type VerificationFilter = 'default' | 'verified' | 'notverified';
export type ScanFilter = 'default' | 'scanned' | 'notscanned';
export type RatingFilter = 'default' | 'rated' | 'notrated';
export type RatingSource = 'user' | 'average';
export type PlaysFilter = 'default' | 'played' | 'notplayed';
export type SearchMode = 'all' | 'name' | 'version' | 'tags';

export type CollectionFilters = {
    ownership: OwnershipFilter;
    trade: TradeFilter;
    want: WantFilter;
    condition: ConditionFilter;
    version: VersionFilter;
    wishlist: WishlistFilter;
    wishlistPriority: WishlistPriorityFilter;
    preorder: PreorderFilter;
    verification: VerificationFilter;
    scan: ScanFilter;
    rating: RatingFilter;
    ratingSource: RatingSource;
    ratingMin: string;
    ratingMax: string;
    plays: PlaysFilter;
    playsMin: string;
    playsMax: string;
    // a player count the game supports (minPlayers <= n <= maxPlayers); '' = any
    players: string;
    // the longest play time, in minutes, the game may take; '' = any
    maxPlayTime: string;
    searchMode: SearchMode;
    searchText: string;
};

export type FilterPreset = {
    id: number;
    name: string;
    filters: CollectionFilters;
};

export const DEFAULT_FILTERS: CollectionFilters = {
    ownership: 'default',
    trade: 'default',
    want: 'default',
    condition: 'default',
    version: 'default',
    wishlist: 'default',
    wishlistPriority: 'default',
    preorder: 'default',
    verification: 'default',
    scan: 'default',
    rating: 'default',
    ratingSource: 'user',
    ratingMin: '',
    ratingMax: '',
    plays: 'default',
    playsMin: '',
    playsMax: '',
    players: '',
    maxPlayTime: '',
    searchMode: 'all',
    searchText: '',
};

export const FILTER_KEYS = Object.keys(DEFAULT_FILTERS) as (keyof CollectionFilters)[];

// Keys excluded from saved filter presets (search state is ephemeral)
const PRESET_EXCLUDED_KEYS = new Set<keyof CollectionFilters>(['searchMode', 'searchText']);

// ── Serialization ──────────────────────────────────────────────────────────────

/** The filters that differ from the defaults and apply, as URL query / localStorage values. */
export const getSerializableFilters = (filters: CollectionFilters): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const key of FILTER_KEYS) {
        const value = filters[key];
        if (value === DEFAULT_FILTERS[key]) {
            continue;
        }
        if ((key === 'ratingMin' || key === 'ratingMax' || key === 'ratingSource') && filters.rating !== 'rated') {
            continue;
        }
        if ((key === 'playsMin' || key === 'playsMax') && filters.plays !== 'played') {
            continue;
        }
        if (key === 'wishlistPriority' && filters.wishlist === 'default') {
            continue;
        }
        result[key] = value;
    }
    return result;
};

/** Like `getSerializableFilters`, without the search, which presets don't save. */
export const getPresetFilters = (filters: CollectionFilters): Record<string, string> => {
    const result = getSerializableFilters(filters);
    for (const key of PRESET_EXCLUDED_KEYS) {
        delete result[key as string];
    }
    return result;
};

export const hasActiveFilters = (filters: CollectionFilters) =>
    filters.ownership !== 'default' ||
    filters.trade !== 'default' ||
    filters.want !== 'default' ||
    filters.condition !== 'default' ||
    filters.version !== 'default' ||
    filters.wishlist !== 'default' ||
    filters.wishlistPriority !== 'default' ||
    filters.preorder !== 'default' ||
    filters.verification !== 'default' ||
    filters.scan !== 'default' ||
    filters.rating !== 'default' ||
    filters.plays !== 'default' ||
    filters.players !== '' ||
    filters.maxPlayTime !== '' ||
    filters.searchText !== '';

// ── Search parsing ─────────────────────────────────────────────────────────────

// A single parsed tag token. `negate` is set when the token is prefixed with
// `!` (e.g. `!#sleeved`), meaning the item must NOT carry that tag.
export type TagQuery = {
    tag: string;
    negate: boolean;
};

export const parseTagFilter = (raw: string): TagQuery[] => {
    const tokens = raw.trim().split(/[\s,]+/).filter(Boolean);
    return tokens
        .map(token => {
            const negate = token.startsWith('!');
            const bare = negate ? token.slice(1) : token;
            const tag = (bare.startsWith('#') ? bare : `#${bare}`).toLowerCase();
            return { tag, negate };
        })
        .filter(({ tag }) => tag !== '#');
};

export type UnifiedSearch = {
    nameQuery: string;
    versionQuery: string;
    tagQueries: TagQuery[];
    // Set in All mode with no prefixes: OR match across name + version
    anyTextQuery: string;
};

export const parseUnifiedSearch = (
    searchText: string,
    searchMode: SearchMode,
): UnifiedSearch => {
    const empty: UnifiedSearch = { nameQuery: '', versionQuery: '', tagQueries: [], anyTextQuery: '' };
    const trimmed = searchText.trim();
    if (!trimmed) {
        return empty;
    }

    if (searchMode === 'name') {
        return { ...empty, nameQuery: trimmed.toLowerCase() };
    }
    if (searchMode === 'version') {
        return { ...empty, versionQuery: trimmed.toLowerCase() };
    }
    if (searchMode === 'tags') {
        return { ...empty, tagQueries: parseTagFilter(trimmed) };
    }

    // mode === 'all': parse prefixes
    const prefixPattern = /\b(name|version|tags):\s*/gi;
    const matches: Array<{ key: string; index: number; length: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = prefixPattern.exec(trimmed)) !== null) {
        matches.push({ key: m[1].toLowerCase(), index: m.index, length: m[0].length });
    }

    // No prefixes → OR match across name and version
    if (matches.length === 0) {
        return { ...empty, anyTextQuery: trimmed.toLowerCase() };
    }

    let nameQuery = '';
    let versionQuery = '';
    let tagQueries: TagQuery[] = [];

    const before = trimmed.slice(0, matches[0].index).trim();
    if (before) {
        nameQuery = before.toLowerCase();
    }

    for (let i = 0; i < matches.length; i++) {
        const { key, index, length } = matches[i];
        const valueStart = index + length;
        const valueEnd = i + 1 < matches.length ? matches[i + 1].index : trimmed.length;
        const value = trimmed.slice(valueStart, valueEnd).trim();
        if (key === 'name') {
            nameQuery = value.toLowerCase();
        } else if (key === 'version') {
            versionQuery = value.toLowerCase();
        } else if (key === 'tags') {
            tagQueries = parseTagFilter(value);
        }
    }

    return { nameQuery, versionQuery, tagQueries, anyTextQuery: '' };
};

// ── Filter function ────────────────────────────────────────────────────────────

/** The longest play time BGG gives for the item, in minutes. */
export const getLongestPlayTime = (item: BggCollectionItem) =>
    item.maxPlayTime ?? item.playingTime ?? item.minPlayTime;

/** Whether the item has the player-count data the `players` filter needs. */
export const hasPlayerCountData = (item: BggCollectionItem) =>
    item.minPlayers !== undefined && item.maxPlayers !== undefined;

/** Data outside the collection item that some filters need. */
export type CollectionFilterContext = {
    scannedSet: Set<number>;
    verifiedSet: Set<number>;
    tagMap: BggTagMap;
};

export type MakeFilterFnOptions = {
    // skip the name part of the search (name prefix / Name mode / All mode text), keeping version and tags
    ignoreNameSearch?: boolean;
};

/** A predicate that keeps the collection items the filters show. */
export const createCollectionFilterFn = (
    filters: CollectionFilters,
    context: CollectionFilterContext,
    options?: MakeFilterFnOptions,
) => {
    const { scannedSet, verifiedSet, tagMap } = context;
    const parsed = parseUnifiedSearch(filters.searchText, filters.searchMode);
    const { versionQuery, tagQueries } = parsed;
    // a BGG search matches names itself, so its collection matches skip the name part of the search
    const nameQuery = options?.ignoreNameSearch ? '' : parsed.nameQuery;
    const anyTextQuery = options?.ignoreNameSearch ? '' : parsed.anyTextQuery;
    const ratingMin = filters.ratingMin !== '' ? parseFloat(filters.ratingMin) : undefined;
    const ratingMax = filters.ratingMax !== '' ? parseFloat(filters.ratingMax) : undefined;
    const playsMin = filters.playsMin !== '' ? parseInt(filters.playsMin, 10) : undefined;
    const playsMax = filters.playsMax !== '' ? parseInt(filters.playsMax, 10) : undefined;
    const players = parseInt(filters.players, 10);
    const maxPlayTime = parseInt(filters.maxPlayTime, 10);

    return (item: BggCollectionItem): boolean => {
        const { statuses } = item;

        // Ownership
        if (filters.ownership === 'own' && !statuses.own) {
            return false;
        }
        if (filters.ownership === 'prevowned' && !statuses.prevowned) {
            return false;
        }
        if (filters.ownership === 'notowned' && (statuses.own || statuses.prevowned)) {
            return false;
        }

        // Trade
        if (filters.trade === 'fortrade' && !statuses.fortrade) {
            return false;
        }
        if (filters.trade === 'nottrade' && statuses.fortrade) {
            return false;
        }

        // Want
        if (filters.want === 'want' && !statuses.want) {
            return false;
        }
        if (filters.want === 'wanttoplay' && !statuses.wanttoplay) {
            return false;
        }
        if (filters.want === 'wanttobuy' && !statuses.wanttobuy) {
            return false;
        }

        // Condition
        if (filters.condition === 'has' && !item.tradeCondition) {
            return false;
        }
        if (filters.condition === 'not' && !!item.tradeCondition) {
            return false;
        }

        // Version
        if (filters.version === 'versioned' && !item.version?.id) {
            return false;
        }
        if (filters.version === 'notversioned' && !!item.version?.id) {
            return false;
        }

        // Wishlist
        if (filters.wishlist === 'wishlist' && !statuses.wishlist) {
            return false;
        }
        if (filters.wishlist === 'notwishlist' && statuses.wishlist) {
            return false;
        }

        // Wishlist Priority (only meaningful when wishlist filter is active)
        if (filters.wishlistPriority !== 'default' && filters.wishlist !== 'default') {
            const priority = item.wishlistPriority;
            if (priority !== undefined && priority.toString() !== filters.wishlistPriority) {
                return false;
            }
        }

        // Preorder
        if (filters.preorder === 'preordered' && !statuses.preordered) {
            return false;
        }
        if (filters.preorder === 'notpreordered' && statuses.preordered) {
            return false;
        }

        // Scan
        if (filters.scan === 'scanned' && !scannedSet.has(item.objectId)) {
            return false;
        }
        if (filters.scan === 'notscanned' && scannedSet.has(item.objectId)) {
            return false;
        }

        // Verification
        if (filters.verification === 'verified' && !verifiedSet.has(item.objectId)) {
            return false;
        }
        if (filters.verification === 'notverified' && verifiedSet.has(item.objectId)) {
            return false;
        }

        // Rating
        if (filters.rating === 'notrated') {
            if (item.rating !== undefined) {
                return false;
            }
        } else if (filters.rating === 'rated') {
            const ratingValue = filters.ratingSource === 'average'
                ? item.averageRating
                : item.rating;
            if (ratingValue === undefined) {
                return false;
            }
            if (ratingMin !== undefined && !isNaN(ratingMin) && ratingValue < ratingMin) {
                return false;
            }
            if (ratingMax !== undefined && !isNaN(ratingMax) && ratingValue > ratingMax) {
                return false;
            }
        }

        // Plays
        const plays = item.plays ?? 0;
        if (filters.plays === 'notplayed') {
            if (plays > 0) {
                return false;
            }
        } else if (filters.plays === 'played') {
            if (plays === 0) {
                return false;
            }
            if (playsMin !== undefined && !isNaN(playsMin) && plays < playsMin) {
                return false;
            }
            if (playsMax !== undefined && !isNaN(playsMax) && plays > playsMax) {
                return false;
            }
        }

        // Player count: items without player counts don't match
        if (!isNaN(players)) {
            const { minPlayers, maxPlayers } = item;
            if (minPlayers === undefined || maxPlayers === undefined) {
                return false;
            }
            if (players < minPlayers || players > maxPlayers) {
                return false;
            }
        }

        // Play time: the longest stated time must fit; items without a play time don't match
        if (!isNaN(maxPlayTime)) {
            const playTime = getLongestPlayTime(item);
            if (playTime === undefined || playTime > maxPlayTime) {
                return false;
            }
        }

        // Text search: OR across name + version (All mode, no prefix)
        if (anyTextQuery) {
            const nameMatch = item.name.toLowerCase().includes(anyTextQuery);
            const versionMatch = item.version?.name?.toLowerCase().includes(anyTextQuery) ?? false;
            if (!nameMatch && !versionMatch) {
                return false;
            }
        }

        // Text search: name (prefix or Name mode)
        if (nameQuery && !item.name.toLowerCase().includes(nameQuery)) {
            return false;
        }

        // Text search: version name (prefix or Version mode)
        if (versionQuery && !(item.version?.name?.toLowerCase().includes(versionQuery) ?? false)) {
            return false;
        }

        // Text search: tags (AND logic; `!` negates)
        for (const { tag, negate } of tagQueries) {
            const hasTag = tagMap[tag]?.includes(item.collectionId) ?? false;
            if (hasTag === negate) {
                return false;
            }
        }

        return true;
    };
};

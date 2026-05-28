import { database, deleteFilter, renameFilter } from '@/app/lib/database/database';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
};

export type FilterPreset = {
    id: number;
    name: string;
    filters: CollectionFilters;
};

const DEFAULT_FILTERS: CollectionFilters = {
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
};

const LS_KEY = 'collection-filters';
const FILTER_KEYS = Object.keys(DEFAULT_FILTERS) as (keyof CollectionFilters)[];

const getSerializableFilters = (filters: CollectionFilters): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const key of FILTER_KEYS) {
        const value = filters[key];
        if (value === DEFAULT_FILTERS[key]) { continue; }
        if ((key === 'ratingMin' || key === 'ratingMax' || key === 'ratingSource') && filters.rating !== 'rated') { continue; }
        if ((key === 'playsMin' || key === 'playsMax') && filters.plays !== 'played') { continue; }
        if (key === 'wishlistPriority' && filters.wishlist === 'default') { continue; }
        result[key] = value;
    }
    return result;
};

const readInitialFilters = (): CollectionFilters => {
    if (typeof window === 'undefined') { return DEFAULT_FILTERS; }

    const params = new URLSearchParams(window.location.search);
    const hasUrlFilter = FILTER_KEYS.some(key => params.has(key));
    if (hasUrlFilter) {
        const partial: Record<string, string> = {};
        for (const key of FILTER_KEYS) {
            const val = params.get(key);
            if (val !== null) { partial[key] = val; }
        }
        return { ...DEFAULT_FILTERS, ...(partial as Partial<CollectionFilters>) };
    }

    try {
        const stored = localStorage.getItem(LS_KEY);
        if (!stored) { return DEFAULT_FILTERS; }
        return { ...DEFAULT_FILTERS, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_FILTERS;
    }
};

// ── Three-state toggle cycle ───────────────────────────────────────────────────

export const cycleThreeState = <T extends string>(
    current: T,
    states: readonly [T, T, T],
): T => {
    const idx = states.indexOf(current);
    return states[(idx + 1) % 3];
};

// ── Hook ──────────────────────────────────────────────────────────────────────

type UseCollectionFiltersResult = {
    filters: CollectionFilters;
    setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
    resetFilters: () => void;
    hasActiveFilters: boolean;
    makeFilterFn: (
        scannedSet: Set<number>,
        verifiedSet: Set<number>,
    ) => (item: BggCollectionItem) => boolean;
    savedFilters: FilterPreset[];
    saveFilterPreset: () => Promise<void>;
    loadFilterPreset: (preset: FilterPreset) => void;
    renameFilterPreset: (id: number) => Promise<void>;
    deleteFilterPreset: (id: number) => Promise<void>;
    duplicateFilterPreset: (id: number) => Promise<void>;
};

export const useCollectionFilters = (): UseCollectionFiltersResult => {
    const [filters, setFilters] = useState<CollectionFilters>(readInitialFilters);
    const [savedFilters, setSavedFilters] = useState<FilterPreset[]>([]);

    useEffect(() => {
        let active = true;
        database.filters.toArray().then(items => {
            if (!active) { return; }
            setSavedFilters(items.map(item => ({
                id: item.id!,
                name: item.name,
                filters: { ...DEFAULT_FILTERS, ...(item.filters as Partial<CollectionFilters>) },
            })));
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const serialized = getSerializableFilters(filters);
        const params = new URLSearchParams(serialized);
        const search = params.toString();
        const newUrl = search
            ? `${window.location.pathname}?${search}`
            : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
        localStorage.setItem(LS_KEY, JSON.stringify(filters));
    }, [filters]);

    const setFilter = useCallback(<K extends keyof CollectionFilters>(
        key: K,
        value: CollectionFilters[K],
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    const saveFilterPreset = useCallback(async () => {
        const name = window.prompt('Name for this filter set:');
        if (name === null || name.trim() === '') { return; }
        const trimmedName = name.trim();
        if (savedFilters.some(f => f.name === trimmedName)) {
            window.alert(`A preset named "${trimmedName}" already exists.`);
            return;
        }
        const serialized = getSerializableFilters(filters);
        const id = await database.filters.add({ name: trimmedName, filters: serialized });
        const restored = { ...DEFAULT_FILTERS, ...(serialized as Partial<CollectionFilters>) };
        setSavedFilters(prev => [...prev, { id: id as number, name: trimmedName, filters: restored }]);
    }, [filters, savedFilters]);

    const loadFilterPreset = useCallback((preset: FilterPreset) => {
        setFilters(preset.filters);
    }, []);

    const renameFilterPreset = useCallback(async (id: number) => {
        const preset = savedFilters.find(f => f.id === id);
        if (!preset) { return; }
        const name = window.prompt('New name for this filter set:', preset.name);
        if (name === null || name.trim() === '') { return; }
        const trimmedName = name.trim();
        if (trimmedName !== preset.name && savedFilters.some(f => f.name === trimmedName)) {
            window.alert(`A preset named "${trimmedName}" already exists.`);
            return;
        }
        await renameFilter(id, trimmedName);
        setSavedFilters(prev => prev.map(f => f.id === id ? { ...f, name: trimmedName } : f));
    }, [savedFilters]);

    const deleteFilterPreset = useCallback(async (id: number) => {
        await deleteFilter(id);
        setSavedFilters(prev => prev.filter(f => f.id !== id));
    }, []);

    const duplicateFilterPreset = useCallback(async (id: number) => {
        const preset = savedFilters.find(f => f.id === id);
        if (!preset) { return; }
        const baseName = preset.name.replace(/ \(\d+\)$/, '');
        const existingNames = new Set(savedFilters.map(f => f.name));
        let suffix = 1;
        let newName = `${baseName} (${suffix})`;
        while (existingNames.has(newName)) {
            suffix++;
            newName = `${baseName} (${suffix})`;
        }
        const serialized = getSerializableFilters(preset.filters);
        const newId = await database.filters.add({ name: newName, filters: serialized });
        setSavedFilters(prev => [...prev, { id: newId as number, name: newName, filters: preset.filters }]);
    }, [savedFilters]);

    const hasActiveFilters = useMemo(
        () => (
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
            filters.plays !== 'default'
        ),
        [filters],
    );

    const makeFilterFn = useCallback(
        (scannedSet: Set<number>, verifiedSet: Set<number>) =>
            (item: BggCollectionItem): boolean => {
                const { statuses } = item;

                // Ownership
                if (filters.ownership !== 'default') {
                    if (filters.ownership === 'own' && !statuses.own) { return false; }
                    if (filters.ownership === 'prevowned' && !statuses.prevowned) { return false; }
                    if (filters.ownership === 'notowned' && (statuses.own || statuses.prevowned)) { return false; }
                }

                // Trade
                if (filters.trade === 'fortrade' && !statuses.fortrade) { return false; }
                if (filters.trade === 'nottrade' && statuses.fortrade) { return false; }

                // Want
                if (filters.want !== 'default') {
                    if (filters.want === 'want' && !statuses.want) { return false; }
                    if (filters.want === 'wanttoplay' && !statuses.wanttoplay) { return false; }
                    if (filters.want === 'wanttobuy' && !statuses.wanttobuy) { return false; }
                }

                // Condition
                if (filters.condition === 'has' && !item.tradeCondition) { return false; }
                if (filters.condition === 'not' && !!item.tradeCondition) { return false; }

                // Version
                if (filters.version === 'versioned' && !item.version?.id) { return false; }
                if (filters.version === 'notversioned' && !!item.version?.id) { return false; }

                // Wishlist
                if (filters.wishlist === 'wishlist' && !statuses.wishlist) { return false; }
                if (filters.wishlist === 'notwishlist' && statuses.wishlist) { return false; }

                // Wishlist Priority (only meaningful when wishlist filter is active)
                if (filters.wishlistPriority !== 'default' && filters.wishlist !== 'default') {
                    const priority = item.wishlistPriority;
                    if (priority !== undefined && priority.toString() !== filters.wishlistPriority) {
                        return false;
                    }
                }

                // Preorder
                if (filters.preorder === 'preordered' && !statuses.preordered) { return false; }
                if (filters.preorder === 'notpreordered' && statuses.preordered) { return false; }

                // Scan
                if (filters.scan === 'scanned' && !scannedSet.has(item.objectId)) { return false; }
                if (filters.scan === 'notscanned' && scannedSet.has(item.objectId)) { return false; }

                // Verification
                if (filters.verification === 'verified' && !verifiedSet.has(item.objectId)) { return false; }
                if (filters.verification === 'notverified' && verifiedSet.has(item.objectId)) { return false; }

                // Rating
                if (filters.rating === 'notrated') {
                    if (item.rating !== undefined) { return false; }
                } else if (filters.rating === 'rated') {
                    const ratingValue = filters.ratingSource === 'average'
                        ? item.averageRating
                        : item.rating;
                    if (ratingValue === undefined) { return false; }
                    const min = filters.ratingMin !== '' ? parseFloat(filters.ratingMin) : undefined;
                    const max = filters.ratingMax !== '' ? parseFloat(filters.ratingMax) : undefined;
                    if (min !== undefined && !isNaN(min) && ratingValue < min) { return false; }
                    if (max !== undefined && !isNaN(max) && ratingValue > max) { return false; }
                }

                // Plays
                if (filters.plays === 'notplayed') {
                    if ((item.plays ?? 0) > 0) { return false; }
                } else if (filters.plays === 'played') {
                    if ((item.plays ?? 0) === 0) { return false; }
                    const min = filters.playsMin !== '' ? parseInt(filters.playsMin, 10) : undefined;
                    const max = filters.playsMax !== '' ? parseInt(filters.playsMax, 10) : undefined;
                    if (min !== undefined && !isNaN(min) && (item.plays ?? 0) < min) { return false; }
                    if (max !== undefined && !isNaN(max) && (item.plays ?? 0) > max) { return false; }
                }

                return true;
            },
        [filters],
    );

    return {
        filters,
        setFilter,
        resetFilters,
        hasActiveFilters,
        makeFilterFn,
        savedFilters,
        saveFilterPreset,
        loadFilterPreset,
        renameFilterPreset,
        deleteFilterPreset,
        duplicateFilterPreset,
    };
};

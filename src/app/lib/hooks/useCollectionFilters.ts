import { BggCollectionItem } from '@/app/lib/types/bgg';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ── Filter types ───────────────────────────────────────────────────────────────

export type OwnershipFilter = 'default' | 'own' | 'prevowned' | 'notowned';
export type TradeFilter = 'default' | 'fortrade' | 'nottrade';
export type WantFilter = 'default' | 'want' | 'wanttoplay' | 'wanttobuy';
export type ConditionFilter = 'default' | 'has' | 'not';
export type WishlistFilter = 'default' | 'wishlist' | 'notwishlist';
export type WishlistPriorityFilter = 'default' | '1' | '2' | '3' | '4' | '5';
export type PreorderFilter = 'default' | 'preordered' | 'notpreordered';
export type VerificationFilter = 'default' | 'verified' | 'notverified';
export type ScanFilter = 'default' | 'scanned' | 'notscanned';

export type CollectionFilters = {
    ownership: OwnershipFilter;
    trade: TradeFilter;
    want: WantFilter;
    condition: ConditionFilter;
    wishlist: WishlistFilter;
    wishlistPriority: WishlistPriorityFilter;
    preorder: PreorderFilter;
    verification: VerificationFilter;
    scan: ScanFilter;
};

const DEFAULT_FILTERS: CollectionFilters = {
    ownership: 'default',
    trade: 'default',
    want: 'default',
    condition: 'default',
    wishlist: 'default',
    wishlistPriority: 'default',
    preorder: 'default',
    verification: 'default',
    scan: 'default',
};

const LS_KEY = 'collection-filters';

const readStoredFilters = (): CollectionFilters => {
    if (typeof window === 'undefined') { return DEFAULT_FILTERS; }
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
};

export const useCollectionFilters = (): UseCollectionFiltersResult => {
    const [filters, setFilters] = useState<CollectionFilters>(readStoredFilters);

    useEffect(() => {
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

    const hasActiveFilters = useMemo(
        () => Object.entries(filters).some(([, v]) => v !== 'default'),
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

                return true;
            },
        [filters],
    );

    return { filters, setFilter, resetFilters, hasActiveFilters, makeFilterFn };
};


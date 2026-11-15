import { database, deleteFilter, renameFilter } from '@/app/lib/database/database';
import { BggCollectionItem, BggTagMap } from '@/app/lib/types/bgg';
import {
    CollectionFilters,
    createCollectionFilterFn,
    DEFAULT_FILTERS,
    FILTER_KEYS,
    FilterPreset,
    getPresetFilters,
    getSerializableFilters,
    hasActiveFilters as getHasActiveFilters,
    MakeFilterFnOptions,
} from '@/app/lib/utils/collectionFilters';
import { useCallback, useEffect, useMemo, useState } from 'react';

const LS_KEY = 'collection-filters';

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
    // resets every filter but the search
    clearFiltersKeepSearch: () => void;
    hasActiveFilters: boolean;
    makeFilterFn: (
        scannedSet: Set<number>,
        verifiedSet: Set<number>,
        tagMap: BggTagMap,
        options?: MakeFilterFnOptions,
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

    const clearFiltersKeepSearch = useCallback(() => {
        setFilters(prev => ({ ...DEFAULT_FILTERS, searchMode: prev.searchMode, searchText: prev.searchText }));
    }, []);

    const saveFilterPreset = useCallback(async () => {
        const name = window.prompt('Name for this filter set:');
        if (name === null || name.trim() === '') { return; }
        const trimmedName = name.trim();
        if (savedFilters.some(f => f.name === trimmedName)) {
            window.alert(`A preset named "${trimmedName}" already exists.`);
            return;
        }
        const serialized = getPresetFilters(filters);
        const id = await database.filters.add({ name: trimmedName, filters: serialized });
        const restored = { ...DEFAULT_FILTERS, ...(serialized as Partial<CollectionFilters>) };
        setSavedFilters(prev => [...prev, { id: id as number, name: trimmedName, filters: restored }]);
    }, [filters, savedFilters]);

    const loadFilterPreset = useCallback((preset: FilterPreset) => {
        setFilters(prev => ({ ...preset.filters, searchMode: prev.searchMode, searchText: prev.searchText }));
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
        const serialized = getPresetFilters(preset.filters);
        const newId = await database.filters.add({ name: newName, filters: serialized });
        setSavedFilters(prev => [...prev, { id: newId as number, name: newName, filters: preset.filters }]);
    }, [savedFilters]);

    const hasActiveFilters = useMemo(() => getHasActiveFilters(filters), [filters]);

    const makeFilterFn = useCallback(
        (scannedSet: Set<number>, verifiedSet: Set<number>, tagMap: BggTagMap, options?: MakeFilterFnOptions) =>
            createCollectionFilterFn(filters, { scannedSet, verifiedSet, tagMap }, options),
        [filters],
    );

    return {
        filters,
        setFilter,
        resetFilters,
        clearFiltersKeepSearch,
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

import { SortDirection, SortFieldDef, sortCollection } from '@/app/lib/utils/collectionSort';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UseFilterSortOptions<T, F extends string> = {
    items?: T[];
    filterFn: (item: T, query: string) => boolean;
    extraFilterFn?: (item: T) => boolean;
    sortFields: SortFieldDef<T, F>[];
    defaultSortField: F;
    defaultSortDirection?: SortDirection;
    storageKeyPrefix?: string;
};

type UseFilterSortResult<F extends string> = {
    filterText: string;
    setFilterText: (text: string) => void;
    sortField: F;
    sortDirection: SortDirection;
    handleSortClick: (field: F) => void;
    displayItems: ReturnType<typeof Array.prototype.slice>;
};

export const useFilterSort = <T, F extends string>(options: UseFilterSortOptions<T, F>): UseFilterSortResult<F> & { displayItems: T[] } => {
    const {
        items = [],
        filterFn,
        extraFilterFn,
        sortFields,
        defaultSortField,
        defaultSortDirection = 'asc',
        storageKeyPrefix,
    } = options;

    const lsFilterKey = storageKeyPrefix ? `${storageKeyPrefix}-filter` : null;
    const lsSortFieldKey = storageKeyPrefix ? `${storageKeyPrefix}-sort-field` : null;
    const lsSortDirKey = storageKeyPrefix ? `${storageKeyPrefix}-sort-dir` : null;

    const validFields = sortFields.map(s => s.field);

    const [filterText, setFilterText] = useState<string>(() => {
        if (typeof window === 'undefined' || !lsFilterKey) { return ''; }
        return localStorage.getItem(lsFilterKey) ?? '';
    });

    const [sortField, setSortField] = useState<F>(() => {
        if (typeof window === 'undefined' || !lsSortFieldKey) { return defaultSortField; }
        const stored = localStorage.getItem(lsSortFieldKey) as F;
        return validFields.includes(stored) ? stored : defaultSortField;
    });

    const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
        if (typeof window === 'undefined' || !lsSortDirKey) { return defaultSortDirection; }
        const stored = localStorage.getItem(lsSortDirKey) as SortDirection;
        return (stored === 'asc' || stored === 'desc') ? stored : defaultSortDirection;
    });

    useEffect(() => {
        if (!lsFilterKey) { return; }
        localStorage.setItem(lsFilterKey, filterText);
    }, [filterText, lsFilterKey]);

    useEffect(() => {
        if (!lsSortFieldKey) { return; }
        localStorage.setItem(lsSortFieldKey, sortField);
    }, [sortField, lsSortFieldKey]);

    useEffect(() => {
        if (!lsSortDirKey) { return; }
        localStorage.setItem(lsSortDirKey, sortDirection);
    }, [sortDirection, lsSortDirKey]);

    const handleSortClick = useCallback((field: F) => {
        if (sortField === field) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection(defaultSortDirection);
        }
    }, [sortField, defaultSortDirection]);

    const displayItems = useMemo(() => {
        const query = filterText.trim().toLowerCase();
        let filtered = query ? items.filter(item => filterFn(item, query)) : items;
        if (extraFilterFn) { filtered = filtered.filter(extraFilterFn); }
        return sortCollection(filtered, sortField, sortDirection, sortFields);
    }, [items, filterText, filterFn, extraFilterFn, sortField, sortDirection, sortFields]);

    return {
        filterText,
        setFilterText,
        sortField,
        sortDirection,
        handleSortClick,
        displayItems,
    };
};


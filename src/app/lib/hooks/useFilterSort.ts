import { useCallback, useEffect, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export type SortFieldDef<T, F extends string> = {
    field: F;
    label: string;
    compare: (a: T, b: T) => number;
};

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

export const useFilterSort = <T, F extends string>({
    items = [],
    filterFn,
    extraFilterFn,
    sortFields,
    defaultSortField,
    defaultSortDirection = 'asc',
    storageKeyPrefix,
}: UseFilterSortOptions<T, F>): UseFilterSortResult<F> & { displayItems: T[] } => {
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

    const compareFn = useMemo(
        () => sortFields.find(s => s.field === sortField)?.compare,
        [sortFields, sortField],
    );

    const displayItems = useMemo(() => {
        const query = filterText.trim().toLowerCase();
        let filtered = query ? items.filter(item => filterFn(item, query)) : items;
        if (extraFilterFn) { filtered = filtered.filter(extraFilterFn); }
        if (!compareFn) { return filtered; }
        filtered = [...filtered].sort((a, b) => {
            const cmp = compareFn(a, b);
            return sortDirection === 'asc' ? cmp : -cmp;
        });
        return filtered;
    }, [items, filterText, filterFn, extraFilterFn, compareFn, sortDirection]);

    return {
        filterText,
        setFilterText,
        sortField,
        sortDirection,
        handleSortClick,
        displayItems,
    };
};


'use client';

import { useCallback, useState } from 'react';

export const CollectionViews = {
    LIST: 'list',
    SMALL_GRID: 'small-grid',
    LARGE_GRID: 'large-grid',
} as const;
export type CollectionView = typeof CollectionViews[keyof typeof CollectionViews];

const LS_KEY = 'collection-view';

const readStoredView = (): CollectionView => {
    if (typeof window === 'undefined') { return CollectionViews.SMALL_GRID; }
    const stored = localStorage.getItem(LS_KEY) as CollectionView;
    return (
        stored === CollectionViews.LIST ||
        stored === CollectionViews.SMALL_GRID ||
        stored === CollectionViews.LARGE_GRID
    ) ? stored : CollectionViews.SMALL_GRID;
};

type UseCollectionViewResult = {
    view: CollectionView;
    setView: (v: CollectionView) => void;
};

export const useCollectionView = (): UseCollectionViewResult => {
    const [view, setViewInner] = useState<CollectionView>(readStoredView);

    const setView = useCallback((v: CollectionView) => {
        setViewInner(v);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_KEY, v);
        }
    }, []);

    return { view, setView };
};


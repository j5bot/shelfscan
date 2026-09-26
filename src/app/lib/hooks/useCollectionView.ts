'use client';

import { useStoredChoice } from '@/app/lib/hooks/useStoredChoice';

export const CollectionViews = {
    LIST: 'list',
    SMALL_GRID: 'small-grid',
    LARGE_GRID: 'large-grid',
} as const;
export type CollectionView = typeof CollectionViews[keyof typeof CollectionViews];

const LS_KEY = 'collection-view';

const VIEW_CHOICES = Object.values(CollectionViews);

type UseCollectionViewResult = {
    view: CollectionView;
    setView: (v: CollectionView) => void;
};

export const useCollectionView = (): UseCollectionViewResult => {
    const [view, setView] = useStoredChoice<CollectionView>(LS_KEY, VIEW_CHOICES, CollectionViews.SMALL_GRID);

    return { view, setView };
};

import { useCallback, useState } from 'react';

export const CollectionTabs = {
    ALL_GAMES: 'all-games',
    NOT_IN_COLLECTION: 'not-in-collection',
} as const;

export type CollectionTab = typeof CollectionTabs[keyof typeof CollectionTabs];

const LS_ACTIVE_TAB_KEY = 'collection-active-tab';

const readStoredTab = (): CollectionTab => {
    if (typeof window === 'undefined') { return CollectionTabs.ALL_GAMES; }
    const stored = localStorage.getItem(LS_ACTIVE_TAB_KEY);
    return (stored === CollectionTabs.ALL_GAMES || stored === CollectionTabs.NOT_IN_COLLECTION)
        ? stored as CollectionTab
        : CollectionTabs.ALL_GAMES;
};

type UseActiveTabResult = {
    activeTab: CollectionTab;
    setActiveTab: (tab: CollectionTab) => void;
};

export const useActiveCollectionTab = (): UseActiveTabResult => {
    const [activeTab, setActiveTabInner] = useState<CollectionTab>(readStoredTab);

    const setActiveTab = useCallback((tab: CollectionTab) => {
        setActiveTabInner(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_ACTIVE_TAB_KEY, tab);
        }
    }, []);

    return { activeTab, setActiveTab };
};

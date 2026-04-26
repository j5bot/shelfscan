import { useCallback, useState } from 'react';

export type CollectionTab = 'all-games' | 'not-in-collection';

const LS_ACTIVE_TAB_KEY = 'collection-active-tab';

const readStoredTab = (): CollectionTab => {
    if (typeof window === 'undefined') { return 'all-games'; }
    const stored = localStorage.getItem(LS_ACTIVE_TAB_KEY);
    return (stored === 'all-games' || stored === 'not-in-collection') ? stored : 'all-games';
};

type UseActiveTabResult = {
    activeTab: CollectionTab;
    setActiveTab: (tab: CollectionTab) => void;
};

export const useActiveTab = (): UseActiveTabResult => {
    const [activeTab, setActiveTabInner] = useState<CollectionTab>(readStoredTab);

    const setActiveTab = useCallback((tab: CollectionTab) => {
        setActiveTabInner(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_ACTIVE_TAB_KEY, tab);
        }
    }, []);

    return { activeTab, setActiveTab };
};

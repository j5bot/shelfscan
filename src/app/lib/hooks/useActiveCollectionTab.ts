import { useStoredChoice } from '@/app/lib/hooks/useStoredChoice';

export const CollectionTabs = {
    ALL_GAMES: 'all-games',
    NOT_IN_COLLECTION: 'not-in-collection',
} as const;

export type CollectionTab = typeof CollectionTabs[keyof typeof CollectionTabs];

export const getTabId = (tab: CollectionTab) => `tab-${tab}`;
export const getPanelId = (tab: CollectionTab) => `panel-${tab}`;

const LS_ACTIVE_TAB_KEY = 'collection-active-tab';

const TAB_CHOICES = Object.values(CollectionTabs);

type UseActiveTabResult = {
    activeTab: CollectionTab;
    setActiveTab: (tab: CollectionTab) => void;
};

export const useActiveCollectionTab = (): UseActiveTabResult => {
    const [activeTab, setActiveTab] =
        useStoredChoice<CollectionTab>(LS_ACTIVE_TAB_KEY, TAB_CHOICES, CollectionTabs.ALL_GAMES);

    return { activeTab, setActiveTab };
};

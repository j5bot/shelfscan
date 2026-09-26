import { CollectionTab, CollectionTabs, getPanelId, getTabId } from '@/app/lib/hooks/useActiveCollectionTab';
import { KeyboardEvent } from 'react';

const Tabs = [
    { tab: CollectionTabs.ALL_GAMES, label: 'All Games' },
    { tab: CollectionTabs.NOT_IN_COLLECTION, label: 'Not in Collection' },
];

type CollectionTabListProps = {
    activeTab: CollectionTab;
    setActiveTab: (tab: CollectionTab) => void;
};

export const CollectionTabList = ({ activeTab, setActiveTab }: CollectionTabListProps) => {
    const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, tab: CollectionTab) => {
        if (e.key === 'ArrowRight' && tab === CollectionTabs.ALL_GAMES) {
            setActiveTab(CollectionTabs.NOT_IN_COLLECTION);
        } else if (e.key === 'ArrowLeft' && tab === CollectionTabs.NOT_IN_COLLECTION) {
            setActiveTab(CollectionTabs.ALL_GAMES);
        }
    };

    return <div
        role="tablist"
        aria-label="Collection views"
        className="tabs tabs-border mt-2 mb-2"
    >
        {Tabs.map(({ tab, label }) => (
            <button
                key={tab}
                id={getTabId(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={getPanelId(tab)}
                tabIndex={activeTab === tab ? 0 : -1}
                className={`tab${activeTab === tab ? ' tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
                onKeyDown={e => handleTabKeyDown(e, tab)}
            >
                {label}
            </button>
        ))}
    </div>;
};

import { CollectionTab, CollectionTabs } from '@/app/lib/hooks/useActiveCollectionTab';
import {
    GamesAndExpansionsMode,
    GamesAndExpansionsModeLabels,
    GamesAndExpansionsModes,
} from '@/app/lib/hooks/useAllGamesFilter';
import { CollectionView, CollectionViews } from '@/app/lib/hooks/useCollectionView';
import {
    ExpansionsIcon,
    GamesAndExpansionsIcon,
    GamesIcon
} from '@/app/ui/icons/GamesAndExpansionsIcons';
import { FaArrowsRotate, FaBorderAll, FaList, FaStar, FaTableCells } from 'react-icons/fa6';

const GamesAndExpansionsModeIcons = {
    ALL: GamesAndExpansionsIcon,
    GAMES: GamesIcon,
    EXPANSIONS: ExpansionsIcon,
};

const ViewButtons = [
    { view: CollectionViews.LIST, label: 'List view', Icon: FaList },
    { view: CollectionViews.SMALL_GRID, label: 'Small grid view', Icon: FaTableCells },
    { view: CollectionViews.LARGE_GRID, label: 'Large grid view', Icon: FaBorderAll },
];

type CollectionHeaderProps = {
    heading: string;
    activeTab: CollectionTab;
    gamesAndExpansionsMode: GamesAndExpansionsMode;
    onCycleGamesAndExpansions: () => void;
    canRefresh: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    canBatchRate: boolean;
    batchRate: boolean;
    onToggleBatchRate: () => void;
    view: CollectionView;
    setView: (view: CollectionView) => void;
};

export const CollectionHeader = ({
    heading,
    activeTab,
    gamesAndExpansionsMode,
    onCycleGamesAndExpansions,
    canRefresh,
    isRefreshing,
    onRefresh,
    canBatchRate,
    batchRate,
    onToggleBatchRate,
    view,
    setView,
}: CollectionHeaderProps) => {
    const GamesAndExpansionsModeIcon = GamesAndExpansionsModeIcons[gamesAndExpansionsMode];
    const modeLabel = GamesAndExpansionsModeLabels[gamesAndExpansionsMode];

    return <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 relative pl-18 pr-18">
        <h1 className="text-3xl text-center">{heading}</h1>
        <div className="flex justify-start gap-1">
            {activeTab !== CollectionTabs.NOT_IN_COLLECTION && <button
                className="btn btn-sm rounded-md px-1"
                onClick={onCycleGamesAndExpansions}
                aria-label={modeLabel}
                aria-pressed={gamesAndExpansionsMode !== GamesAndExpansionsModes.ALL}
                title={modeLabel}
            >
                <GamesAndExpansionsModeIcon className="w-6 h-6" aria-hidden="true" />
            </button>}
            {canRefresh && (
                <button
                    className="btn btn-sm rounded-md px-2"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    aria-label={isRefreshing ? 'Refreshing collection…' : 'Refresh collection from BGG'}
                    title={isRefreshing ? 'Refreshing…' : 'Refresh from BGG'}
                >
                    <FaArrowsRotate
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                    />
                </button>
            )}
            {canBatchRate && (
                <button
                    className={`btn btn-sm rounded-md px-2 ${
                        batchRate ? 'btn-primary' : ''
                    }`}
                    onClick={onToggleBatchRate}
                    aria-label="Toggle Bulk Rating"
                    aria-pressed={batchRate}
                >
                    <FaStar className="w-4 h-4" aria-hidden="true" />
                </button>
            )}
        </div>
        <div
            className="absolute top-1 right-0 flex items-center gap-0.5"
            role="group"
            aria-label="View mode"
        >
            {ViewButtons.map(({ view: buttonView, label, Icon }) => (
                <button
                    key={buttonView}
                    type="button"
                    className={`btn btn-xs pl-1 pr-1 rounded-md ${view === buttonView ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setView(buttonView)}
                    aria-label={label}
                    title={label}
                    aria-pressed={view === buttonView}
                >
                    <Icon aria-hidden="true" />
                </button>
            ))}
        </div>
    </div>;
};

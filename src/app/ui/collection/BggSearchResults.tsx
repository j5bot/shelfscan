import { type UseBggSearchResult } from '@/app/lib/hooks/useBggSearch';
import { useBggSearchImageUrl } from '@/app/lib/hooks/useBggSearchImageUrl';
import { CollectionViews, type CollectionView } from '@/app/lib/hooks/useCollectionView';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { type BggCollectionItem, type BggSearchEntry } from '@/app/lib/types/bgg';
import { type ComponentModeMap } from '@/app/lib/types/modes';
import {
    formatBggSearchResultName,
    getBggSearchImageCacheId,
    getBggSearchResultUrl,
    isBggSearchQueryLongEnough,
    type PreparedBggSearchResults,
} from '@/app/lib/utils/bggSearch';
import { bggSearchResultToCollectionItem } from '@/app/lib/utils/gameAdapters';
import { CollectionListItem, GridItem } from '@/app/ui/games/AllGamesContent';
import { ListGame } from '@/app/ui/games/ListGame';
import { ListGameRow } from '@/app/ui/games/ListGameRow';
import { GridClasses, SizeKey, ThumbnailSizes } from '@/app/ui/grids/gridSizes';
import posthog from 'posthog-js';
import { type ReactNode, useId } from 'react';
import { FaArrowUpRightFromSquare, FaPlus } from 'react-icons/fa6';

const NOT_IN_COLLECTION = 'Not in your collection';

const ExpansionBadge = ({ className = '' }: { className?: string }) =>
    <span className={`badge badge-xs badge-outline ${className}`}>Expansion</span>;

type BggResultProps = {
    entry: BggSearchEntry;
    onOpen: () => void;
};

// extension results carry an image id; its image is cached under a bgg-search id
const useResultImage = (entry: BggSearchEntry) => {
    const thumbnailUrl = useBggSearchImageUrl(entry.imageId) ?? '';
    const imageCacheId = entry.imageId ? getBggSearchImageCacheId(entry.imageId) : undefined;
    return { thumbnailUrl, imageCacheId };
};

const BggResultGridItem = ({ entry, size, onOpen }: BggResultProps & { size: SizeKey }) => {
    const name = formatBggSearchResultName(entry);
    const { thumbnailUrl, imageCacheId } = useResultImage(entry);
    return <ListGame
        inverted
        size={size}
        keyValue={`bgg-${entry.objectId}`}
        name={name}
        thumbnailUrl={thumbnailUrl}
        imageCacheId={imageCacheId}
        thumbnailSize={ThumbnailSizes[size]}
        statusText="Open on BGG"
        statusIcon={<FaArrowUpRightFromSquare size={11} aria-hidden="true" />}
        cornerIcon={<FaPlus title={NOT_IN_COLLECTION} className="shrink-0" />}
        bottomLeftIcon={entry.subType === 'boardgameexpansion' && <ExpansionBadge className="absolute bottom-1 left-1" />}
        detailUrl={getBggSearchResultUrl(entry)}
        detailUrlTarget="_blank"
        detailUrlRel="noopener noreferrer"
        onClick={onOpen}
    />;
};

const BggResultListItem = ({ entry, onOpen }: BggResultProps) => {
    const { thumbnailUrl, imageCacheId } = useResultImage(entry);
    return <div className="pt-1">
        <ListGameRow
            inverted
            name={formatBggSearchResultName(entry)}
            thumbnailUrl={thumbnailUrl}
            imageCacheId={imageCacheId}
            detailUrl={getBggSearchResultUrl(entry)}
            detailUrlTarget="_blank"
            detailUrlRel="noopener noreferrer"
            onClick={onOpen}
            extraBadges={<>
                {entry.subType === 'boardgameexpansion' && <ExpansionBadge />}
                <FaPlus size={11} title={NOT_IN_COLLECTION} />
            </>}
        />
    </div>;
};

export type BggSearchResultsProps = {
    query: string;
    search: UseBggSearchResult;
    prepared: PreparedBggSearchResults;
    view: CollectionView;
    scannedSet: Set<number>;
    verifiedSet: Set<number>;
    onSelectItem: (item: BggCollectionItem) => void;
    mathTradeSelectedIds: Set<number>;
    onMathTradeToggle: (collectionId: number) => void;
    onClearFilters: () => void;
    modeMap?: ComponentModeMap;
};

/**
 * Shown when nothing in the collection matches: what the search finds on BGG. Games in the collection (found by
 * title, and shown by the other filters) appear as their collection items; the rest in inverted colors.
 */
export const BggSearchResults = (props: BggSearchResultsProps) => {
    const {
        query,
        search,
        prepared,
        view,
        scannedSet,
        verifiedSet,
        onSelectItem,
        mathTradeSelectedIds,
        onMathTradeToggle,
        onClearFilters,
        modeMap,
    } = props;

    const headingId = useId();
    const { hasTrade, isMathTrade, isSwap, isTrade } = useTradeMode();
    const { results, total, hiddenByFilters } = prepared;

    let page = 'collection';
    switch (true) {
        case isMathTrade: page = 'math-trade'; break;
        case isSwap: page = 'swap'; break;
        case isTrade: page = 'trade'; break;
    }

    const openResult = (entry: BggSearchEntry) => {
        posthog.capture('bgg_search_result_opened', { query, objectId: entry.objectId, subType: entry.subType, page });
        onSelectItem(bggSearchResultToCollectionItem(entry));
    };

    const size: SizeKey = view === CollectionViews.LARGE_GRID ? 'large' : 'small';
    const cards = results.flatMap(entry => {
        if (entry.collectionIds.length === 0) {
            return view === CollectionViews.LIST
                   ? [<BggResultListItem key={`bgg-${entry.objectId}`} entry={entry} onOpen={() => openResult(entry)} />]
                   : [<BggResultGridItem key={`bgg-${entry.objectId}`} entry={entry} size={size} onOpen={() => openResult(entry)} />];
        }
        return entry.collectionIds.map(collectionId => view === CollectionViews.LIST
            ? <CollectionListItem
                key={collectionId}
                collectionId={collectionId}
                objectId={entry.objectId}
                isScanned={scannedSet.has(entry.objectId)}
                isVerified={verifiedSet.has(entry.objectId)}
                onSelectItem={onSelectItem}
                mathTradeSelected={mathTradeSelectedIds.has(collectionId)}
                onMathTradeToggle={onMathTradeToggle}
                modeMap={modeMap}
            />
            : <GridItem
                key={collectionId}
                sizeKey={size}
                collectionId={collectionId}
                thumbnailSize={ThumbnailSizes[size]}
                onSelectItem={onSelectItem}
                modeMap={modeMap}
                mathTradeSelected={mathTradeSelectedIds.has(collectionId)}
                onMathTradeToggle={hasTrade ? onMathTradeToggle : undefined}
            />);
    });

    let status: ReactNode;
    let content: ReactNode;
    switch (true) {
        case !query:
            status = <>No games match your filter.</>;
            break;
        case !isBggSearchQueryLongEnough(query):
            status = <>No games match your filter.
                <br />Type at least 3 characters to search BoardGameGeek.</>;
            break;
        case search.status === 'error':
            status = <span className="flex flex-col items-center gap-2">
                Couldn’t search BoardGameGeek.
                <button type="button" className="btn btn-sm btn-primary" onClick={search.retry}>Retry</button>
            </span>;
            break;
        case search.status !== 'success':
            status = <span className="inline-flex items-center gap-2">
                <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                No games match your filter.
                <br />Searching BoardGameGeek…
            </span>;
            break;
        case results.length === 0:
            status = <>No games match your filter,
                <br />and nothing on BoardGameGeek matches “{query}”.</>;
            break;
        default:
            status = <>No games match your filter.
                <br />{total} found on BoardGameGeek for “{query}”.</>;
            content = <section aria-labelledby={headingId} className="pb-2">
                <h2 id={headingId} className="text-base text-center font-semibold px-1">Items From BoardGameGeek</h2>
                <p className="text-xs text-base-content/70 px-1">
                    Games marked with a plus <FaPlus className="inline" size={10} aria-hidden="true" /> aren’t in your
                    collection.
                    {total > results.length && ` Showing ${results.length} of ${total} — refine your search.`}
                </p>
                {view === CollectionViews.LIST
                 ? <div className="flex flex-col">{cards}</div>
                 : <ul className={`${GridClasses[size]} pt-2`}>{cards}</ul>}
            </section>;
            break;
    }

    return <div>
        {hiddenByFilters > 0 && (
            <p className="text-center pb-4 text-xs text-base-content/70">
                {hiddenByFilters === 1
                 ? '1 game in your collection matches this search but is hidden by your filters. '
                 : `${hiddenByFilters} games in your collection match this search but are hidden by your filters. `}
                <button type="button" className="link" onClick={onClearFilters}>Clear filters</button>
            </p>
        )}
        {content}
        <p className="text-center pt-6 pb-4 text-base-content/60" aria-live="polite">{status}</p>
    </div>;
};

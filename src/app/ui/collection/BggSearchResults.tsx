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
    const { thumbnailUrl, imageCacheId } = useResultImage(entry);
    const name = formatBggSearchResultName(entry);
    const detailUrl = getBggSearchResultUrl(entry);
    const thumbnailSize = ThumbnailSizes[size];
    const isExpansion = entry.subType === 'boardgameexpansion';
    const expansionBadge = isExpansion && <ExpansionBadge className="absolute bottom-1 left-1" />;

    return <ListGame
        inverted
        size={size}
        keyValue={`bgg-${entry.objectId}`}
        name={name}
        thumbnailUrl={thumbnailUrl}
        imageCacheId={imageCacheId}
        thumbnailSize={thumbnailSize}
        statusText="Open on BGG"
        statusIcon={<FaArrowUpRightFromSquare size={11} aria-hidden="true" />}
        cornerIcon={<FaPlus title={NOT_IN_COLLECTION} className="shrink-0" />}
        bottomLeftIcon={expansionBadge}
        detailUrl={detailUrl}
        detailUrlTarget="_blank"
        detailUrlRel="noopener noreferrer"
        onClick={onOpen}
    />;
};

const BggResultListItem = ({ entry, onOpen }: BggResultProps) => {
    const { thumbnailUrl, imageCacheId } = useResultImage(entry);
    const name = formatBggSearchResultName(entry);
    const detailUrl = getBggSearchResultUrl(entry);
    const isExpansion = entry.subType === 'boardgameexpansion';
    const badges = <>
        {isExpansion && <ExpansionBadge />}
        <FaPlus size={11} title={NOT_IN_COLLECTION} />
    </>;

    return <div className="pt-1">
        <ListGameRow
            inverted
            name={name}
            thumbnailUrl={thumbnailUrl}
            imageCacheId={imageCacheId}
            detailUrl={detailUrl}
            detailUrlTarget="_blank"
            detailUrlRel="noopener noreferrer"
            onClick={onOpen}
            extraBadges={badges}
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

    const isList = view === CollectionViews.LIST;
    const size: SizeKey = view === CollectionViews.LARGE_GRID ? 'large' : 'small';
    const thumbnailSize = ThumbnailSizes[size];
    const gridMathTradeToggle = hasTrade ? onMathTradeToggle : undefined;

    // a game in the collection shows its collection item(s); any other game its BGG result
    const renderEntry = (entry: BggSearchEntry): ReactNode[] => {
        const { objectId, collectionIds } = entry;
        const onOpen = () => openResult(entry);

        if (collectionIds.length === 0) {
            const card = isList
                         ? <BggResultListItem key={`bgg-${objectId}`} entry={entry} onOpen={onOpen} />
                         : <BggResultGridItem key={`bgg-${objectId}`} entry={entry} size={size} onOpen={onOpen} />;
            return [card];
        }

        const isScanned = scannedSet.has(objectId);
        const isVerified = verifiedSet.has(objectId);
        return collectionIds.map(collectionId => {
            const mathTradeSelected = mathTradeSelectedIds.has(collectionId);
            if (isList) {
                return <CollectionListItem
                    key={collectionId}
                    collectionId={collectionId}
                    objectId={objectId}
                    isScanned={isScanned}
                    isVerified={isVerified}
                    onSelectItem={onSelectItem}
                    mathTradeSelected={mathTradeSelected}
                    onMathTradeToggle={onMathTradeToggle}
                    modeMap={modeMap}
                />;
            }
            return <GridItem
                key={collectionId}
                sizeKey={size}
                collectionId={collectionId}
                thumbnailSize={thumbnailSize}
                onSelectItem={onSelectItem}
                modeMap={modeMap}
                mathTradeSelected={mathTradeSelected}
                onMathTradeToggle={gridMathTradeToggle}
            />;
        });
    };
    const cards = results.flatMap(renderEntry);
    const cardList = isList
                     ? <div className="flex flex-col">{cards}</div>
                     : <ul className={`${GridClasses[size]} pt-2`}>{cards}</ul>;
    const showingNote = total > results.length
                        ? ` Showing ${results.length} of ${total} — refine your search.`
                        : undefined;

    const hiddenMessage = hiddenByFilters === 1
                          ? '1 game in your collection matches this search but is hidden by your filters. '
                          : `${hiddenByFilters} games in your collection match this search but are hidden by your filters. `;
    const hiddenNotice = hiddenByFilters > 0 && (
        <p className="text-center pb-4 text-xs text-base-content/70">
            {hiddenMessage}
            <button type="button" className="link" onClick={onClearFilters}>Clear filters</button>
        </p>
    );

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
                    {showingNote}
                </p>
                {cardList}
            </section>;
            break;
    }

    return <div>
        {hiddenNotice}
        {content}
        <p className="text-center pt-6 pb-4 text-base-content/60" aria-live="polite">{status}</p>
    </div>;
};

'use client';

import { bggGetCollectionInner } from '@/app/lib/actions';
import { getCollection, setCollection } from '@/app/lib/database/database';
import { useSelector } from '@/app/lib/hooks';
import { useFilterSort, SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { RootState } from '@/app/lib/redux/store';
import { getCollectionFromXml } from '@/app/lib/services/bgg/service';
import { BggCollectionItem, BggCollectionMap } from '@/app/lib/types/bgg';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { ListGame } from '@/app/ui/games/ListGame';
import { UnmatchedScansTab } from '@/app/ui/UnmatchedScansTab';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import { CSSProperties, forwardRef, ReactNode, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { FaArrowDown, FaArrowUp, FaArrowsRotate, FaBarcode, FaCheck, FaEye, FaHeart, FaRecycle } from 'react-icons/fa6';
import { VirtuosoGrid } from 'react-virtuoso';

type ActiveTab = 'collection' | 'history';

type SortField = 'name' | 'lastModified' | 'dateLastScanned' | 'yearPublished';

type CollectionState =
    | { status: 'loading' }
    | { status: 'empty' }
    | { status: 'error' }
    | { status: 'loaded'; items: BggCollectionItem[] };

const LS_STORAGE_PREFIX = 'collection';

const THUMBNAIL_SIZE = 100;

const GRID_CLASS = `grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7
    xl:grid-cols-8 2xl:grid-cols-10`;

type GridContainerProps = {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
    ({ children, style, className }, ref) => (
        <div
            ref={ref}
            className={`${GRID_CLASS}${className ? ` ${className}` : ''}`}
            style={style}
        >
            {children}
        </div>
    ),
);
GridContainer.displayName = 'GridContainer';

const SkeletonItem = () => (
    <div
        className="relative rounded-md bg-white dark:bg-gray-900"
        aria-hidden="true"
    >
        <div className="flex flex-col pt-1 p-3 md:p-4 md:pt-2 gap-2 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
            <div
                className="bg-gray-200 dark:bg-gray-700 rounded-md mx-auto"
                style={{ width: `${THUMBNAIL_SIZE}px`, height: `${THUMBNAIL_SIZE}px` }}
            />
        </div>
    </div>
);

export default function CollectionPage() {
    useTitle('ShelfScan | Collection');

    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const [state, setState] = useState<CollectionState>({ status: 'loading' });
    const [activeTab, setActiveTab] = useState<ActiveTab>('collection');
    const mountedRef = useRef(true);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isRefreshing, startRefresh] = useTransition();
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [announceText, setAnnounceText] = useState('');
    const [stickyTop, setStickyTop] = useState<number>(0);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);

    const { scanHistory } = useScanHistory();

    const lastScannedMap = useMemo(() => {
        const map = new Map<number, number>();
        for (const entry of scanHistory) {
            if (entry.bggId !== undefined) {
                const existing = map.get(entry.bggId) ?? 0;
                if (entry.timestamp > existing) {
                    map.set(entry.bggId, entry.timestamp);
                }
            }
        }
        return map;
    }, [scanHistory]);

    const collectionSortFields = useMemo<SortFieldDef<BggCollectionItem, SortField>[]>(() => [
        {
            field: 'name',
            label: 'Name',
            compare: (a, b) => a.name.localeCompare(b.name),
        },
        {
            field: 'lastModified',
            label: 'Last Modified',
            compare: (a, b) => {
                const aMod = a.lastModified ?
                    new Date(a.lastModified).valueOf() :
                    (a.acquisitiondate ? new Date(a.acquisitiondate).valueOf() : 0);
                const bMod = b.lastModified ?
                    new Date(b.lastModified).valueOf() :
                    (b.acquisitiondate ? new Date(b.acquisitiondate).valueOf() : 0);
                return aMod - bMod;
            },
        },
        {
            field: 'dateLastScanned',
            label: 'Last Scanned',
            compare: (a, b) => (lastScannedMap.get(a.objectId) ?? 0) - (lastScannedMap.get(b.objectId) ?? 0),
        },
        {
            field: 'yearPublished',
            label: 'Year',
            compare: (a, b) => (a.yearPublished ?? 0) - (b.yearPublished ?? 0),
        },
    ], [lastScannedMap]);

    const loadedItems = useMemo(
        () => state.status === 'loaded' ? state.items : [],
        [state],
    );

    const {
        filterText,
        setFilterText,
        sortField,
        sortDirection,
        handleSortClick,
        displayItems,
    } = useFilterSort<BggCollectionItem, SortField>({
        items: loadedItems,
        filterFn: (item, query) => item.name.toLowerCase().includes(query),
        sortFields: collectionSortFields,
        defaultSortField: 'name',
        storageKeyPrefix: LS_STORAGE_PREFIX,
    });

    useEffect(() => {
        const sentinel = sentinelRef.current;
        const section = sectionRef.current;
        if (!sentinel || !section) {
            return;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                // sentinel has scrolled above the viewport — stick the bar at the section top
                setStickyTop(section.getBoundingClientRect().top > 0
                    ? section.getBoundingClientRect().top
                    : 0);
            } else {
                setStickyTop(0);
            }
        }, { threshold: 0 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [state.status]);

    const loadCollection = useCallback(async () => {
        setState({ status: 'loading' });
        try {
            let map: BggCollectionMap | undefined;
            if (username) {
                map = await getCollection(username.toLowerCase());
            }
            if (!mountedRef.current) {
                return;
            }
            if (!map || Object.keys(map).length === 0) {
                setState({ status: 'empty' });
                return;
            }
            setState({ status: 'loaded', items: Object.values(map) });
        } catch {
            if (!mountedRef.current) {
                return;
            }
            setState({ status: 'error' });
        }
    }, [username]);

    const refreshCollection = useCallback(() => {
        if (!username || isRefreshing) {
            return;
        }
        setRefreshError(null);
        startRefresh(async () => {
            try {
                const xml = await bggGetCollectionInner(username, 0);
                const items = getCollectionFromXml(xml);
                if (!items || Object.keys(items).length === 0) {
                    if (mountedRef.current) {
                        setRefreshError('No collection data returned from BGG.');
                    }
                    return;
                }
                await setCollection(username.toLowerCase(), items);
                if (!mountedRef.current) {
                    return;
                }
                setState({ status: 'loaded', items: Object.values(items) });
                setAnnounceText('Collection refreshed successfully.');
                if (refreshTimerRef.current !== null) {
                    clearTimeout(refreshTimerRef.current);
                }
                refreshTimerRef.current = setTimeout(() => {
                    refreshTimerRef.current = null;
                    if (mountedRef.current) {
                        setAnnounceText('');
                    }
                }, 3000);
            } catch {
                if (mountedRef.current) {
                    setRefreshError('Error refreshing collection. Please try again.');
                }
            }
        });
    }, [username, isRefreshing]);

    useEffect(() => {
        mountedRef.current = true;
        loadCollection().then();
        return () => {
            mountedRef.current = false;
            if (refreshTimerRef.current !== null) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [loadCollection]);

    const renderContent = () => {
        switch (state.status) {
            case 'loading':
                return (
                    <div
                        className={`${GRID_CLASS} pt-2`}
                        aria-label="Loading collection"
                        aria-busy="true"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SkeletonItem key={i} />
                        ))}
                    </div>
                );

            case 'error':
                return (
                    <div
                        className="flex flex-col items-center gap-4 p-8 pt-10 text-center"
                        role="alert"
                    >
                        <p className="text-lg">
                            Error loading collection. Please try refreshing.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => refreshCollection()}
                        >
                            Retry
                        </button>
                    </div>
                );

            case 'empty':
                return (
                    <div className="flex flex-col items-center gap-4 p-8 pt-10 text-center">
                        <p className="text-lg">
                            Your collection is empty. Start scanning games to see them here!
                        </p>
                        <Link
                            href="/"
                            title="Go to scanner"
                            className={`scan-button cursor-pointer rounded-2xl
                                flex justify-start items-center
                                bg-gray-400 text-white
                                p-6 pt-2 pb-2
                                text-4xl`}
                        >
                            <FaBarcode className="w-12 h-9" />
                            <div className="p-1.5 font-semibold uppercase">Scan</div>
                        </Link>
                    </div>
                );

            case 'loaded': {
                return (
                    <>
                        <div ref={sentinelRef} aria-hidden="true" style={{ height: 0 }} />
                        <div
                            className={`sticky z-10
                                bg-[#f1eff9] dark:bg-yellow-700
                                pt-2 pb-2 flex flex-col gap-2`}
                            style={{ top: stickyTop }}
                        >
                            <label htmlFor="collection-filter-input" className="sr-only">
                                Filter by name
                            </label>
                            <input
                                id="collection-filter-input"
                                type="search"
                                aria-label="Filter by name"
                                placeholder="Filter by name…"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                className="input input-bordered input-sm w-full"
                            />
                            <div
                                className="flex flex-wrap gap-1"
                                role="group"
                                aria-label="Sort games"
                            >
                                {collectionSortFields.map(({ field, label }) => {
                                    const isActive = sortField === field;
                                    const direction = isActive ? sortDirection : undefined;
                                    return (
                                        <button
                                            key={field}
                                            onClick={() => handleSortClick(field)}
                                            className={`btn btn-xs gap-1 ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                                            aria-sort={isActive
                                                ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                                                : 'none'
                                            }
                                            aria-label={`Sort by ${label}${direction ? `, ${direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                                        >
                                            {label}
                                            {isActive && (
                                                sortDirection === 'asc'
                                                    ? <FaArrowUp size={10} aria-hidden="true" />
                                                    : <FaArrowDown size={10} aria-hidden="true" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {displayItems.length === 0 ? (
                            <p className="text-center py-8 text-base-content/60">
                                No games match your filter.
                            </p>
                        ) : (
                            <VirtuosoGrid
                                useWindowScroll
                                totalCount={displayItems.length}
                                components={{
                                    List: GridContainer,
                                }}
                                itemContent={(index) => {
                                    const item = displayItems[index];
                                    const thumbnailUrl = item.version?.image ?? item.thumbnail ?? '';
                                    const { height, width } = getImageSizeFromUrl(thumbnailUrl);
                                    const size = Math.ceil(Math.min(height, width) * 2 / 3);

                                    let statusText: string = '';
                                    let cornerIcon: ReactNode;

                                    switch (true) {
                                        case item.statuses.fortrade:
                                            statusText = 'For Trade';
                                            cornerIcon = <FaRecycle title={statusText} className="shrink-0" />;
                                            break;
                                        case item.statuses.own:
                                            statusText = 'Owned';
                                            cornerIcon = <FaCheck title={statusText} className="shrink-0" />;
                                            break;
                                        case item.statuses.wishlist:
                                            statusText = 'Wishlist';
                                            cornerIcon = <FaHeart title={statusText} className="shrink-0" />;
                                            break;
                                        default:
                                            statusText = '';
                                            cornerIcon = <FaEye size={15} className="shrink-0" />;
                                            break;
                                    }

                                    return (
                                        <ListGame
                                            keyValue={item.collectionId.toString()}
                                            name={item.name}
                                            thumbnailUrl={thumbnailUrl}
                                            smallSquareSize={size}
                                            statusText={statusText}
                                            cornerIcon={cornerIcon}
                                            statusIcon={null}
                                            detailUrl={`https://boardgamegeek.com/boardgame/${item.objectId}`}
                                        detailUrlTarget="_blank"
                                    detailUrlRel="noopener noreferrer"/>
                                    );
                                }}
                            />
                        )}
                    </>
                );
            }
        }
    };

    return (
        <>
            <NavDrawer />
            <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announceText}
            </div>
            {refreshError && (
                <div className="toast toast-top toast-center z-50">
                    <div role="alert" className="alert alert-error shadow-lg">
                        <span className="text-sm">{refreshError}</span>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setRefreshError(null)}
                            aria-label="Dismiss error"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            <div className="page-content w-screen pt-15 flex justify-center">
                <div className={`w-11/12
                    p-4 pb-10 rounded-xl
                    bg-base-100 text-sm`}>
                    <div className="flex items-center justify-center gap-3 mb-0">
                        <h1 className="text-3xl text-center">
                            Collection
                        </h1>
                        {username && (
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => refreshCollection()}
                                disabled={isRefreshing}
                                aria-label={isRefreshing ? 'Refreshing collection…' : 'Refresh collection from BGG'}
                                title={isRefreshing ? 'Refreshing…' : 'Refresh from BGG'}
                            >
                                <FaArrowsRotate
                                    className={isRefreshing ? 'animate-spin' : ''}
                                    aria-hidden="true"
                                />
                            </button>
                        )}
                    </div>
                    <div role="tablist" className="tabs tabs-border mt-4 mb-2">
                        <button
                            role="tab"
                            className={`tab${activeTab === 'collection' ? ' tab-active' : ''}`}
                            onClick={() => setActiveTab('collection')}
                        >
                            Games
                        </button>
                        <button
                            role="tab"
                            className={`tab${activeTab === 'history' ? ' tab-active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Scan History
                        </button>
                    </div>
                    <section
                        ref={sectionRef}
                        className="w-full bg-[#f1eff9] dark:bg-yellow-700 rounded-md p-4 pt-2"
                        aria-label={activeTab === 'collection' ? 'Game collection' : 'Scan history'}
                    >
                        {activeTab === 'collection' && renderContent()}
                        {activeTab === 'history' && <UnmatchedScansTab />}
                    </section>
                </div>
            </div>
        </>
    );
}

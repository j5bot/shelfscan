'use client';

import { getCollection } from '@/app/lib/database/database';
import { useSelector } from '@/app/lib/hooks';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem, BggCollectionMap } from '@/app/lib/types/bgg';
import { ListGame } from '@/app/ui/games/ListGame';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import { CSSProperties, forwardRef, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { FaBarcode } from 'react-icons/fa6';
import { VirtuosoGrid } from 'react-virtuoso';

type CollectionState =
    | { status: 'loading' }
    | { status: 'empty' }
    | { status: 'error' }
    | { status: 'loaded'; items: BggCollectionItem[] };

const THUMBNAIL_SIZE = 80;

const GRID_CLASS = 'grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';

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
    const mountedRef = useRef(true);

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

    useEffect(() => {
        mountedRef.current = true;
        loadCollection().then();
        return () => {
            mountedRef.current = false;
        };
    }, [loadCollection]);

    const renderContent = () => {
        switch (state.status) {
            case 'loading':
                return (
                    <div
                        className={GRID_CLASS}
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
                        className="flex flex-col items-center gap-4 p-8 text-center"
                        role="alert"
                    >
                        <p className="text-lg">
                            Error loading collection. Please try refreshing.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => loadCollection().then()}
                        >
                            Retry
                        </button>
                    </div>
                );

            case 'empty':
                return (
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
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
                const { items } = state;
                return (
                    <VirtuosoGrid
                        useWindowScroll
                        totalCount={items.length}
                        components={{
                            List: GridContainer,
                        }}
                        itemContent={(index) => {
                            const item = items[index];
                            const thumbnailUrl = item.version?.image ?? '';

                            let statusText: string;
                            if (item.statuses.own) {
                                statusText = 'Owned';
                            } else if (item.statuses.fortrade) {
                                statusText = 'For Trade';
                            } else if (item.statuses.wishlist) {
                                statusText = 'Wishlist';
                            } else {
                                statusText = 'In Collection';
                            }

                            return (
                                <ListGame
                                    key={item.collectionId.toString()}
                                    name={item.name}
                                    thumbnailUrl={thumbnailUrl}
                                    smallSquareSize={THUMBNAIL_SIZE}
                                    statusText={statusText}
                                    statusIcon={null}
                                    detailUrl={`https://boardgamegeek.com/boardgame/${item.objectId}`}
                                />
                            );
                        }}
                    />
                );
            }
        }
    };

    return (
        <>
            <NavDrawer />
            <main className="flex flex-col w-full items-center p-3 sm:p-4 pt-15">
                <h1 className="text-2xl font-semibold tracking-wide mb-4">
                    My Collection
                </h1>
                <section
                    className="w-full"
                    aria-label="Game collection"
                >
                    {renderContent()}
                </section>
            </main>
        </>
    );
}

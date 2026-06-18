'use client';

import { CollectionViews, type CollectionView } from '@/app/lib/hooks/useCollectionView';
import { GeekMarketProduct } from '@/app/lib/types/market';
import { GetExtensionLink } from '@/app/ui/GetExtensionLink';
import { ListGame } from '@/app/ui/games/ListGame';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import Link from 'next/link';
import { forwardRef, type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { FaArrowsRotate, FaTag } from 'react-icons/fa6';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

const BGG_BASE = 'https://boardgamegeek.com';

const GridClasses = {
    small: `grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10`,
    large: `grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`,
} as const;
type GridClassSize = keyof typeof GridClasses;

type GridContainerProps = {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const makeGridContainer = (size: GridClassSize) => {
    const gridClass = GridClasses[size];
    const Result = forwardRef<HTMLDivElement, GridContainerProps>(
        ({ children, style, className }, ref) => (
            <div ref={ref} className={`${gridClass} ${className}`} style={style}>
                {children}
            </div>
        ),
    );
    Result.displayName = 'GridContainer';
    return Result;
};

const formatListDate = (listdate: string): string => {
    const d = new Date(listdate);
    return Number.isNaN(d.getTime())
        ? listdate
        : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

type MarketListingRowProps = {
    product: GeekMarketProduct;
};

const MarketListingRow = ({ product }: MarketListingRowProps) => {
    const thumbnailUrl = (product.version?.imageSets ?? product.imagesets)?.mediacard?.['src@2x'] ?? '';
    const name = product.version?.name ?? product.objectlink?.name ?? '';
    const href = `${BGG_BASE}${product.producthref}`;

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md px-2 py-1">
            <Link href={href} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <ThumbnailBox alt={name} url={thumbnailUrl} size={50} />
            </Link>
            <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-sm font-medium truncate"
                title={name}
            >
                {name}
            </Link>
            <div className="flex items-center gap-2 shrink-0 text-sm text-base-content/70">
                <span className="font-semibold text-base-content">
                    {product.currencysymbol}{product.price}
                </span>
                <span className="hidden sm:inline text-xs">{product.prettycondition}</span>
                <span className="hidden md:inline text-xs">{formatListDate(product.listdate)}</span>
            </div>
        </div>
    );
};

type MarketContentProps = {
    products: GeekMarketProduct[];
    isLoading: boolean;
    onRefresh: () => void;
    syncOn: boolean;
    view: CollectionView;
};

export const MarketContent = ({
    products,
    isLoading,
    onRefresh,
    syncOn,
    view,
}: MarketContentProps) => {
    const [filterText, setFilterText] = useState('');

    const displayItems = useMemo(() => {
        if (!filterText.trim()) { return products; }
        const q = filterText.toLowerCase();
        return products.filter(p =>
            (p.objectlink?.name ?? p.version.name).toLowerCase().includes(q),
        );
    }, [products, filterText]);

    if (!syncOn) {
        return (
            <div className="flex flex-col items-center gap-4 p-8 pt-10 text-center">
                <p className="text-lg">
                    Install the ShelfScan browser extension to load your BGG Marketplace listings.
                </p>
                <GetExtensionLink />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <span className="loading loading-spinner loading-lg" aria-label="Loading marketplace listings" />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 p-8 pt-10 text-center">
                <FaTag className="text-4xl text-base-content/30" aria-hidden="true" />
                <p className="text-base-content/60">No marketplace listings found.</p>
                <button className="btn btn-sm rounded-md" onClick={onRefresh}>
                    <FaArrowsRotate aria-hidden="true" />
                    Load Listings
                </button>
            </div>
        );
    }

    const renderGridItem = (product: GeekMarketProduct, thumbnailSize: number) => {
        const thumbnailUrl = (product.version?.imageSets ?? product.imagesets)?.mediacard?.['src@2x'] ?? '';
        const name = product.version?.name ?? product.objectlink?.name ?? '';
        const href = `${BGG_BASE}${product.producthref}`;
        const statusText = `${product.currencysymbol}${product.price} · ${product.prettycondition}`;

        return (
            <ListGame
                keyValue={product.productid}
                name={name}
                thumbnailUrl={thumbnailUrl}
                thumbnailSize={thumbnailSize}
                statusText={statusText}
                statusIcon={null}
                cornerIcon={
                    <span className="text-xs font-semibold text-base-content/80">
                        {product.currencysymbol}{product.price.split('.')[0]}
                    </span>
                }
                detailUrl={href}
                detailUrlTarget="_blank"
                detailUrlRel="noopener noreferrer"
            />
        );
    };

    let content: ReactNode;
    switch (view) {
        case CollectionViews.LIST:
            content = (
                <Virtuoso
                    useWindowScroll
                    totalCount={displayItems.length}
                    itemContent={index => (
                        <div className="pt-1">
                            <MarketListingRow product={displayItems[index]} />
                        </div>
                    )}
                />
            );
            break;
        case CollectionViews.LARGE_GRID:
            content = (
                <VirtuosoGrid
                    useWindowScroll
                    totalCount={displayItems.length}
                    components={{ List: makeGridContainer('large') }}
                    itemContent={index => renderGridItem(displayItems[index], 200)}
                />
            );
            break;
        case CollectionViews.SMALL_GRID:
        default:
            content = (
                <VirtuosoGrid
                    useWindowScroll
                    totalCount={displayItems.length}
                    components={{ List: makeGridContainer('small') }}
                    itemContent={index => renderGridItem(displayItems[index], 100)}
                />
            );
            break;
    }

    return (
        <>
            <div className="flex items-center gap-2 py-2 px-1 sticky top-0 z-10 bg-[#f1eff9] dark:bg-yellow-700">
                <input
                    type="search"
                    className="input input-sm input-bordered flex-1 rounded-md"
                    placeholder="Filter listings…"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    aria-label="Filter marketplace listings"
                />
                <span className="text-xs text-base-content/60 shrink-0">
                    {displayItems.length} of {products.length}
                </span>
                <button
                    className="btn btn-sm rounded-md shrink-0"
                    onClick={onRefresh}
                    disabled={isLoading}
                    aria-label="Refresh marketplace listings"
                    title="Refresh from BGG"
                >
                    <FaArrowsRotate
                        className={isLoading ? 'animate-spin' : ''}
                        aria-hidden="true"
                    />
                </button>
            </div>
            {displayItems.length === 0 ? (
                <div className="flex justify-center py-8">
                    <p className="text-base-content/60 text-sm">No listings match your filter.</p>
                </div>
            ) : content}
        </>
    );
};

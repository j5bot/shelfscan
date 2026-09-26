import { useSelector } from '@/app/lib/hooks';
import { EMPTY_TAGS, selectTagsByCollectionId } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem, BggCollectionStatuses } from '@/app/lib/types/bgg';
import { ComponentModeMap } from '@/app/lib/types/modes';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import Link from 'next/link';
import { ReactNode } from 'react';
import {
    FaArrowUpRightFromSquare,
    FaBarcode,
    FaCalendar,
    FaCheck,
    FaHeart,
    FaRecycle,
    FaStar,
    FaThumbsUp,
} from 'react-icons/fa6';

const LIST_THUMBNAIL_SIZE = 50;

type ListGameRowBaseProps = {
    detailUrl: string;
    detailUrlTarget?: string;
    detailUrlRel?: string;
    isScanned?: boolean;
    isVerified?: boolean;
    /** Extra status badges or content rendered after the built-in badges. */
    extraBadges?: ReactNode;
    /** When provided, clicking the row opens an action (e.g. a modal) instead of navigating. */
    onClick?: () => void;
    modeMap?: ComponentModeMap;
};

type ListGameRowCollectionProps = ListGameRowBaseProps & {
    collectionId: number;
    name?: never;
    thumbnailUrl?: never;
};

type ListGameRowSimpleProps = ListGameRowBaseProps & {
    collectionId?: never;
    name: string;
    thumbnailUrl?: string;
};

export type ListGameRowProps = ListGameRowCollectionProps | ListGameRowSimpleProps;

const StatusBadge = ({ icon, label, active }: { icon: ReactNode; label: string; active: boolean }) =>
    active ? (
        <span
            className="inline-flex items-center gap-0.5 text-xs text-base-content/70"
            title={label}
            aria-label={label}
        >
            {icon}
        </span>
    ) : null;

const CollectionStatusBadges = ({ statuses }: { statuses: BggCollectionStatuses }) => <>
    <StatusBadge icon={<FaCheck size={11} />} label="Owned" active={statuses.own} />
    <StatusBadge icon={<FaRecycle size={11} />} label="For Trade" active={statuses.fortrade} />
    <StatusBadge icon={<FaHeart size={11} />} label="Wishlist" active={statuses.wishlist} />
    <StatusBadge icon={<FaStar size={11} />} label="Want" active={statuses.want || statuses.wanttoplay || statuses.wanttobuy} />
    <StatusBadge icon={<FaCalendar size={11} />} label="Preordered" active={statuses.preordered} />
</>;

const RowTags = ({ tags }: { tags: string[] }) => tags.length > 0 && (
    <div className="flex gap-1 overflow-hidden mt-0.5">
        {tags.map(tag => (
            <span
                key={tag}
                className="text-[10px] leading-tight px-1 rounded bg-base-200 text-base-content/60 whitespace-nowrap"
            >
                {tag}
            </span>
        ))}
    </div>
);

type DetailLinkProps = {
    href?: string;
    target?: string;
    rel?: string;
    className: string;
    title?: string;
    children: ReactNode;
};

/** Links to the detail page, or is a plain wrapper when the row opens its own action instead. */
const DetailLink = (props: DetailLinkProps) => {
    const {
        href,
        target,
        rel,
        className,
        title,
        children,
    } = props;

    return href
    ? <Link href={href} target={target} rel={rel} className={className} title={title}>{children}</Link>
    : <div className={className} title={title}>{children}</div>;
};

const getRowDisplay = (item: BggCollectionItem | undefined, name?: string, thumbnailUrl?: string) => item
    ? { name: item.name, thumbnailUrl: item.version?.image ?? item.image ?? item.thumbnail ?? '' }
    : { name, thumbnailUrl: thumbnailUrl ?? '' };

export const ListGameRow = (props: ListGameRowProps) => {
    const {
        collectionId,
        name,
        thumbnailUrl: thumbnailUrlProp,
        detailUrl,
        detailUrlTarget,
        detailUrlRel,
        isScanned = false,
        isVerified = false,
        extraBadges,
        onClick,
        modeMap,
    } = props;

    const item = useSelector((state: RootState) => {
        const username = state.bgg.user.user?.toLowerCase() ?? '';
        return collectionId
               ? state.bgg.collection.users[username].items[collectionId]
               : undefined;
    });

    const tags = useSelector((state: RootState) =>
        (collectionId ? selectTagsByCollectionId([state])[collectionId] : undefined) ?? EMPTY_TAGS,
    );

    const { name: resolvedName, thumbnailUrl: resolvedThumbnailUrl } = getRowDisplay(item, name, thumbnailUrlProp);
    const statuses = item?.statuses;
    // when the row has its own action, the thumbnail and name are not links
    const linkHref = onClick ? undefined : detailUrl;

    return (
        <div className="relative flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md px-2 py-1">
            {/* stretched button: the whole row opens details; the BGG link stays clickable above it */}
            {onClick && <button
                type="button"
                className="absolute inset-0 w-full h-full rounded-md cursor-pointer"
                aria-label={`View details for ${resolvedName}`}
                onClick={onClick}
            />}
            <DetailLink href={linkHref} target={detailUrlTarget} rel={detailUrlRel} className="shrink-0">
                <ThumbnailBox
                    alt={resolvedName ?? resolvedThumbnailUrl}
                    url={resolvedThumbnailUrl}
                    size={LIST_THUMBNAIL_SIZE}
                />
            </DetailLink>
            <div className="flex-1 min-w-0">
                <DetailLink
                    href={linkHref}
                    target={detailUrlTarget}
                    rel={detailUrlRel}
                    className="block text-sm font-medium truncate"
                    title={resolvedName}
                >
                    {resolvedName}
                </DetailLink>
                <RowTags tags={tags} />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-base-content/60">
                {statuses && <CollectionStatusBadges statuses={statuses} />}
                <StatusBadge icon={<FaBarcode size={11} />} label="Scanned" active={isScanned} />
                <StatusBadge icon={<FaThumbsUp size={11} />} label="Verified" active={isVerified} />
                {extraBadges}
                {onClick && (
                    <Link
                        href={detailUrl}
                        target={detailUrlTarget}
                        rel={detailUrlRel}
                        title="Open on BGG"
                        aria-label="Open on BGG"
                        className="relative"
                    >
                        <FaArrowUpRightFromSquare size={11} />
                    </Link>
                )}
            </div>
        </div>
    );
};

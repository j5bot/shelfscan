import { BggCollectionItem } from '@/app/lib/types/bgg';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import Link from 'next/link';
import { ReactNode } from 'react';
import {
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
};

type ListGameRowCollectionProps = ListGameRowBaseProps & {
    item: BggCollectionItem;
    name?: never;
    thumbnailUrl?: never;
};

type ListGameRowSimpleProps = ListGameRowBaseProps & {
    item?: never;
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

export const ListGameRow = ({
    item,
    name,
    thumbnailUrl: thumbnailUrlProp,
    detailUrl,
    detailUrlTarget,
    detailUrlRel,
    isScanned = false,
    isVerified = false,
    extraBadges,
}: ListGameRowProps) => {
    const resolvedName = item ? item.name : name;
    const resolvedThumbnailUrl = item
        ? (item.version?.image ?? item.image ?? item.thumbnail ?? '')
        : (thumbnailUrlProp ?? '');
    const statuses = item?.statuses;

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md px-2 py-1">
            <Link
                href={detailUrl}
                target={detailUrlTarget}
                rel={detailUrlRel}
                className="shrink-0"
            >
                <ThumbnailBox
                    alt={resolvedName}
                    url={resolvedThumbnailUrl}
                    size={LIST_THUMBNAIL_SIZE}
                />
            </Link>
            <Link
                href={detailUrl}
                target={detailUrlTarget}
                rel={detailUrlRel}
                className="flex-1 min-w-0 text-sm font-medium truncate"
                title={resolvedName}
            >
                {resolvedName}
            </Link>
            <div className="flex items-center gap-1.5 shrink-0 text-base-content/60">
                {statuses && <>
                    <StatusBadge icon={<FaCheck size={11} />} label="Owned" active={statuses.own} />
                    <StatusBadge icon={<FaRecycle size={11} />} label="For Trade" active={statuses.fortrade} />
                    <StatusBadge icon={<FaHeart size={11} />} label="Wishlist" active={statuses.wishlist} />
                    <StatusBadge icon={<FaStar size={11} />} label="Want" active={statuses.want || statuses.wanttoplay || statuses.wanttobuy} />
                    <StatusBadge icon={<FaCalendar size={11} />} label="Preordered" active={statuses.preordered} />
                </>}
                <StatusBadge icon={<FaBarcode size={11} />} label="Scanned" active={isScanned} />
                <StatusBadge icon={<FaThumbsUp size={11} />} label="Verified" active={isVerified} />
                {extraBadges}
            </div>
        </div>
    );
};


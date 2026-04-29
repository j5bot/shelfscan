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

type ListGameRowProps = {
    item: BggCollectionItem;
    detailUrl: string;
    detailUrlTarget?: string;
    detailUrlRel?: string;
    isScanned: boolean;
    isVerified: boolean;
};

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
    detailUrl,
    detailUrlTarget,
    detailUrlRel,
    isScanned,
    isVerified,
}: ListGameRowProps) => {
    const thumbnailUrl = item.version?.image ?? item.image ?? item.thumbnail ?? '';
    const { statuses } = item;

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md px-2 py-1">
            <Link
                href={detailUrl}
                target={detailUrlTarget}
                rel={detailUrlRel}
                className="shrink-0"
            >
                <ThumbnailBox
                    alt={item.name}
                    url={thumbnailUrl}
                    size={LIST_THUMBNAIL_SIZE}
                />
            </Link>
            <Link
                href={detailUrl}
                target={detailUrlTarget}
                rel={detailUrlRel}
                className="flex-1 min-w-0 text-sm font-medium truncate"
                title={item.name}
            >
                {item.name}
            </Link>
            <div className="flex items-center gap-1.5 shrink-0 text-base-content/60">
                <StatusBadge icon={<FaCheck size={11} />} label="Owned" active={statuses.own} />
                <StatusBadge icon={<FaRecycle size={11} />} label="For Trade" active={statuses.fortrade} />
                <StatusBadge icon={<FaHeart size={11} />} label="Wishlist" active={statuses.wishlist} />
                <StatusBadge icon={<FaStar size={11} />} label="Want" active={statuses.want || statuses.wanttoplay || statuses.wanttobuy} />
                <StatusBadge icon={<FaCalendar size={11} />} label="Preordered" active={statuses.preordered} />
                <StatusBadge icon={<FaBarcode size={11} />} label="Scanned" active={isScanned} />
                <StatusBadge icon={<FaThumbsUp size={11} />} label="Verified" active={isVerified} />
            </div>
        </div>
    );
};


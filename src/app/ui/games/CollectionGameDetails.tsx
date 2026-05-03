import { type BggCollectionItem } from '@/app/lib/types/bgg';
import { collectionItemToGame, collectionVersionToVersion } from '@/app/lib/utils/gameAdapters';
import { GameDetails, GameDetailsProps } from '@/app/ui/games/GameDetails';
import React, { type ReactNode } from 'react';
import { type IconType } from 'react-icons';
import { FaCheck, FaEye, FaHeart, FaRecycle } from 'react-icons/fa6';

type CollectionHeaderIcon = {
    title: string;
    Icon: IconType;
};

const statusIconsMap = {
    own: { title: 'Own', Icon: FaCheck },
    fortrade: { title: 'For Trade', Icon: FaRecycle },
    wishlist: { title: 'Wishlist', Icon: FaHeart },
    all: { title: 'Found', Icon: FaEye },
} as const;

const computeCollectionHeader = (item: BggCollectionItem): ReactNode => {
    const icons: CollectionHeaderIcon[] = [];

    Object.keys(statusIconsMap).reduce((acc: CollectionHeaderIcon[], statusKey: string) => {
        if (!item.statuses[statusKey as keyof typeof item.statuses]) {
            return acc;
        }
        acc.push(statusIconsMap[statusKey as keyof typeof statusIconsMap]);
        return acc;
    }, icons);

    return <>
        {icons.map(({ title, Icon }) => (
            <div
                key={title}
                className="tooltip bg-gray-400 scale-80 md:scale-none flex items-center justify-center h-10 w-10 rounded-full"
                data-tooltip={title}
            >
                <Icon size={24} className="tooltip text-white" title={title} />
            </div>
        ))}
    </>;
};

type CollectionGameDetailsProps = Omit<GameDetailsProps, 'view'> & {
    item: BggCollectionItem;
};

/**
 * Wrapper around GameDetails for display of a game from the user's BGG
 * collection. Adapts BggCollectionItem to the common Game/Version types and
 * renders without a search form. Accepts children for future BGG-specific
 * information such as rating and play count.
 */
export const CollectionGameDetails = ({ item, header, children, thumbnailSize }: CollectionGameDetailsProps) => {
    const game = collectionItemToGame(item);
    const adaptedVersion = item.version ? collectionVersionToVersion(item.version) : undefined;
    const computedHeader = header ?? computeCollectionHeader(item);

    return <GameDetails
        view="collection"
        game={game}
        version={adaptedVersion}
        header={computedHeader}
        thumbnailSize={thumbnailSize}
    >
        {children}
    </GameDetails>;
};

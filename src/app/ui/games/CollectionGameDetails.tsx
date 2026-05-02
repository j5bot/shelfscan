import { type BggCollectionItem } from '@/app/lib/types/bgg';
import { collectionItemToGame, collectionVersionToVersion } from '@/app/lib/utils/gameAdapters';
import { GameDetails, GameDetailsProps } from '@/app/ui/games/GameDetails';
import React, { type ReactNode } from 'react';

type CollectionGameDetailsProps = GameDetailsProps & {
    item: BggCollectionItem;
};

/**
 * Wrapper around GameDetails for display of a game from the user's BGG
 * collection. Adapts BggCollectionItem to the common Game/Version types and
 * renders without a search form. Accepts children for future BGG-specific
 * information such as rating and play count.
 */
export const CollectionGameDetails = ({ item, header, children }: CollectionGameDetailsProps) => {
    const game = collectionItemToGame(item);
    const adaptedVersion = item.version ? collectionVersionToVersion(item.version) : undefined;

    return <GameDetails
        game={game}
        version={adaptedVersion}
        header={header}
    >
        {children}
    </GameDetails>;
};


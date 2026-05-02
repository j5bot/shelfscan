'use client';

import { type BggCollectionItem } from '@/app/lib/types/bgg';
import { collectionItemToGame, collectionVersionToVersion } from '@/app/lib/utils/gameAdapters';
import { GameDetails } from '@/app/ui/games/GameDetails';
import React, { type ReactNode } from 'react';

type CollectionGameDetailsProps = {
    item: BggCollectionItem;
    header?: ReactNode;
    /**
     * Slot for BGG-specific information such as user rating, play count, etc.
     * Rendered inside the game details actions area.
     */
    children?: ReactNode;
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

    const pluginGameData: Record<string, unknown> = {
        id: item.objectId,
        name: item.name,
        page_url: game.pageUrl,
        thumbnail_url: item.thumbnail,
        image_url: item.image,
    };

    const pluginVersionData: Record<string, unknown> | undefined = item.version
        ? {
            version_id: item.version.id,
            name: item.version.name,
            page_url: adaptedVersion?.pageUrl,
            image_url: item.version.image,
            published: item.version.yearPublished,
            language: item.version.languages?.join(', '),
        }
        : undefined;

    return <GameDetails
        game={game}
        version={adaptedVersion}
        pluginGameData={pluginGameData}
        pluginVersionData={pluginVersionData}
        header={header}
    >
        {children}
    </GameDetails>;
};


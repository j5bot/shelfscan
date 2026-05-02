import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { gameUPCInfoToGame, gameUPCVersionToVersion } from '@/app/lib/utils/gameAdapters';
import { GameDetails, type GameDetailsProps } from '@/app/ui/games/GameDetails';
import { useSearchParams } from 'next/navigation';
import React, { type ReactNode } from 'react';

type SelectVersionGameDetailsProps = GameDetailsProps;

/**
 * Wrapper around GameDetails for use inside a SelectVersionProvider context.
 * Reads GameUPC data from the context, adapts it to the common Game/Version
 * types, and injects search functionality.
 */
export const SelectVersionGameDetails = ({ header, children }: SelectVersionGameDetailsProps) => {
    const { defaultImageUrl, info, infos, searchGameUPC, version } = useSelectVersionContext();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q');

    const game = info ? gameUPCInfoToGame(info) : undefined;
    const adaptedVersion = version ? gameUPCVersionToVersion(version) : undefined;

    const searchProps: GameDetailsProps['search'] = {
        onSearch: searchGameUPC,
        initialQuery: searchQuery ?? '',
        initialOpen: !infos?.length || !!searchQuery,
    };

    return <GameDetails
        game={game}
        version={adaptedVersion}
        defaultImageUrl={defaultImageUrl}
        search={searchProps}
        header={header}
    >
        {children}
    </GameDetails>;
};


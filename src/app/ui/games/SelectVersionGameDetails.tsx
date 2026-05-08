import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { gameUPCInfoToGame, gameUPCVersionToVersion } from '@/app/lib/utils/gameAdapters';
import { GameDetails, type GameDetailsProps } from '@/app/ui/games/GameDetails';
import { useSearchParams } from 'next/navigation';

type SelectVersionGameDetailsProps = Omit<GameDetailsProps, 'view'>;

/**
 * Wrapper around GameDetails for use inside a SelectVersionProvider context.
 * Reads GameUPC data from the context, adapts it to the common Game/Version
 * types, and injects search functionality.
 */
export const SelectVersionGameDetails = ({ header, children }: SelectVersionGameDetailsProps) => {
    const { defaultImageUrl, id, info, infos, searchGameUPC, version } = useSelectVersionContext();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q');

    const game = info ? gameUPCInfoToGame(info) : undefined;
    const defaultGame = !game && infos?.[0] ? gameUPCInfoToGame(infos[0]) : undefined;
    const adaptedVersion = version ? gameUPCVersionToVersion(version) : undefined;

    const searchProps: GameDetailsProps['search'] = {
        onSearch: searchGameUPC,
        initialQuery: searchQuery ?? '',
        initialOpen: !infos?.length || !!searchQuery,
    };

    return <GameDetails
        code={id}
        view="version"
        game={game}
        defaultGame={defaultGame}
        version={adaptedVersion}
        defaultImageUrl={defaultImageUrl}
        search={searchProps}
        header={header}
    >
        {children}
    </GameDetails>;
};


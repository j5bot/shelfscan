import { useSelector } from '@/app/lib/hooks';
import { useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { useFilterSort } from '@/app/lib/hooks/useFilterSort';
import { selectTagMap } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { type AllGamesSortField, getCollectionSortFields } from '@/app/lib/utils/collectionSort';
import { getScannedSets } from '@/app/lib/utils/scanSets';
import { useCallback, useMemo, useState } from 'react';

export const GamesAndExpansionsModes = {
    ALL: 'ALL',
    GAMES: 'GAMES',
    EXPANSIONS: 'EXPANSIONS',
} as const;

export type GamesAndExpansionsMode = keyof typeof GamesAndExpansionsModes;

export const GamesAndExpansionsModeLabels = {
    ALL: 'Games and Expansions',
    GAMES: 'Games',
    EXPANSIONS: 'Expansions',
} as const;

const GamesAndExpansionsModeSubTypes = {
    GAMES: 'boardgame',
    EXPANSIONS: 'boardgameexpansion',
} as const;

const advanceStepper = <T,>(steps: T[], current: T) => {
    const index = steps.findIndex(step => step === current);
    return steps[(index + 1) % steps.length];
};

const nextGamesAndExpansionsMode = (current: GamesAndExpansionsMode) => {
    const modes = Object.keys(GamesAndExpansionsModes) as GamesAndExpansionsMode[];
    return advanceStepper<GamesAndExpansionsMode>(modes, current);
};

type UseAllGamesFilterOptions = {
    items: BggCollectionItem[];
    makeFilterFn: ReturnType<typeof useCollectionFilters>['makeFilterFn'];
};

/** Filtering and sorting for the "All Games" tab, including the games/expansions toggle. */
export const useAllGamesFilter = ({ items, makeFilterFn }: UseAllGamesFilterOptions) => {
    const { scanHistory, lastScannedMap } = useScanHistory();
    const tagMap = useSelector((state: RootState) => selectTagMap([state]));

    const [gamesAndExpansionsMode, setGamesAndExpansionsMode] =
        useState<GamesAndExpansionsMode>(GamesAndExpansionsModes.ALL);

    const cycleGamesAndExpansionsMode = useCallback(() => {
        setGamesAndExpansionsMode(prev => nextGamesAndExpansionsMode(prev));
    }, []);

    const { scannedSet, verifiedSet } = useMemo(() => getScannedSets(scanHistory), [scanHistory]);

    const extraFilterFn = useMemo(
        () => makeFilterFn(scannedSet, verifiedSet, tagMap),
        [makeFilterFn, scannedSet, verifiedSet, tagMap],
    );

    const nameIgnoringFilterFn = useMemo(
        () => makeFilterFn(scannedSet, verifiedSet, tagMap, { ignoreNameSearch: true }),
        [makeFilterFn, scannedSet, verifiedSet, tagMap],
    );

    const subType = gamesAndExpansionsMode === GamesAndExpansionsModes.ALL
                    ? undefined
                    : GamesAndExpansionsModeSubTypes[gamesAndExpansionsMode];

    const allGamesExtraFilterFn = useCallback((item: BggCollectionItem): boolean =>
        extraFilterFn(item) && (!subType || item.subType === subType),
    [extraFilterFn, subType]);

    // whether every filter but the name search shows the item: for games a BGG search found by title
    const isShownIgnoringName = useCallback((item: BggCollectionItem): boolean =>
        nameIgnoringFilterFn(item) && (!subType || item.subType === subType),
    [nameIgnoringFilterFn, subType]);

    const resetGamesAndExpansionsMode = useCallback(() => {
        setGamesAndExpansionsMode(GamesAndExpansionsModes.ALL);
    }, []);

    const sortFields = useMemo(() => getCollectionSortFields(lastScannedMap), [lastScannedMap]);

    const filter = useFilterSort<BggCollectionItem, AllGamesSortField>({
        items,
        filterFn: () => true,
        extraFilterFn: allGamesExtraFilterFn,
        sortFields,
        defaultSortField: 'name',
        storageKeyPrefix: 'collection-all',
    });

    return {
        filter,
        sortFields,
        scannedSet,
        verifiedSet,
        gamesAndExpansionsMode,
        cycleGamesAndExpansionsMode,
        resetGamesAndExpansionsMode,
        // the board game / expansion subtype the games and expansions toggle limits to, if any
        subType,
        isShownIgnoringName,
    };
};

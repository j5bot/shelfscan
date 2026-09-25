import { useSelector } from '@/app/lib/hooks';
import { useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { SortFieldDef, useFilterSort } from '@/app/lib/hooks/useFilterSort';
import { selectTagMap } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { type AllGamesSortField } from '@/app/ui/games/AllGamesContent';
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

const modifiedOrAcquired = (item: BggCollectionItem) =>
    item.lastModified
        ? new Date(item.lastModified).valueOf()
        : (item.acquisitiondate ? new Date(item.acquisitiondate).valueOf() : 0);

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

    const scannedSet = useMemo(() => {
        const set = new Set<number>();
        for (const entry of scanHistory) {
            if (entry.bggId !== undefined) { set.add(entry.bggId); }
        }
        return set;
    }, [scanHistory]);

    const verifiedSet = useMemo(() => {
        const set = new Set<number>();
        for (const entry of scanHistory) {
            if (entry.bggId !== undefined && entry.verified) { set.add(entry.bggId); }
        }
        return set;
    }, [scanHistory]);

    const extraFilterFn = useMemo(
        () => makeFilterFn(scannedSet, verifiedSet, tagMap),
        [makeFilterFn, scannedSet, verifiedSet, tagMap],
    );

    const allGamesExtraFilterFn = useCallback((item: BggCollectionItem): boolean => {
        if (!extraFilterFn(item)) { return false; }
        if (gamesAndExpansionsMode === GamesAndExpansionsModes.ALL) { return true; }
        return item.subType === GamesAndExpansionsModeSubTypes[gamesAndExpansionsMode];
    }, [extraFilterFn, gamesAndExpansionsMode]);

    const sortFields = useMemo<SortFieldDef<BggCollectionItem, AllGamesSortField>[]>(() => [
        {
            field: 'name',
            label: 'Name',
            compare: (a, b) => a.name?.localeCompare(b.name),
        },
        {
            field: 'lastModified',
            label: 'Modified',
            compare: (a, b) => modifiedOrAcquired(a) - modifiedOrAcquired(b),
        },
        {
            field: 'rating',
            label: 'Rating',
            compare: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
        },
        {
            field: 'averageRating',
            label: 'Avg. Rating',
            compare: (a, b) => (a.averageRating ?? 0) - (b.averageRating ?? 0),
        },
        {
            field: 'plays',
            label: 'Plays',
            compare: (a, b) => (a.plays ?? 0) - (b.plays ?? 0),
        },
        {
            field: 'dateLastScanned',
            label: 'Scanned',
            compare: (a, b) => (lastScannedMap.get(a.objectId) ?? 0) - (lastScannedMap.get(b.objectId) ?? 0),
        },
        {
            field: 'yearPublished',
            label: 'Year',
            compare: (a, b) => (a.yearPublished ?? 0) - (b.yearPublished ?? 0),
        },
    ], [lastScannedMap]);

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
    };
};

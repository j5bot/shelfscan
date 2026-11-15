import { BggCollectionItem, BggCollectionMap, PossibleStatus, PossibleStatuses } from '@/app/lib/types/bgg';

export type BggCollectionSummary = {
    total: number;
    games: number;
    expansions: number;
    statuses: Record<PossibleStatus, number>;
};

/** Counts the items, games, expansions and items with each BGG status. */
export const summarizeCollection = (items: BggCollectionMap | BggCollectionItem[]): BggCollectionSummary => {
    const values = Array.isArray(items) ? items : Object.values(items);
    const expansions = values.filter(item => item.subType === 'boardgameexpansion').length;
    const statuses = Object.fromEntries(PossibleStatuses.map(status => [
        status,
        values.filter(item => item.statuses?.[status]).length,
    ])) as BggCollectionSummary['statuses'];

    return {
        total: values.length,
        games: values.length - expansions,
        expansions,
        statuses,
    };
};

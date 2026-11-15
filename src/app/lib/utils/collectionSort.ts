import { BggCollectionItem } from '@/app/lib/types/bgg';

export type SortDirection = 'asc' | 'desc';

export type SortFieldDef<T, F extends string> = {
    field: F;
    label: string;
    compare: (a: T, b: T) => number;
};

export const AllGamesSortFields = [
    'name',
    'lastModified',
    'dateLastScanned',
    'yearPublished',
    'rating',
    'averageRating',
    'plays',
] as const;

export type AllGamesSortField = typeof AllGamesSortFields[number];

const modifiedOrAcquired = (item: BggCollectionItem) =>
    item.lastModified
        ? new Date(item.lastModified).valueOf()
        : (item.acquisitiondate ? new Date(item.acquisitiondate).valueOf() : 0);

/** The All Games tab's sort fields; `lastScannedMap` maps a BGG id to when it was last scanned. */
export const getCollectionSortFields =
    (lastScannedMap: Map<number, number>): SortFieldDef<BggCollectionItem, AllGamesSortField>[] => [
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
    ];

/** A sorted copy of `items`; an unknown `field` leaves the order unchanged. */
export const sortCollection = <T, F extends string>(
    items: T[],
    field: F,
    direction: SortDirection,
    sortFields: SortFieldDef<T, F>[],
): T[] => {
    const compare = sortFields.find(s => s.field === field)?.compare;
    if (!compare) {
        return items;
    }
    return [...items].sort((a, b) => {
        const cmp = compare(a, b);
        return direction === 'asc' ? cmp : -cmp;
    });
};

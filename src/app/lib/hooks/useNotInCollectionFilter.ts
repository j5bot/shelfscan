import { CollectionLoadStatus, CollectionLoadStatuses } from '@/app/lib/hooks/useCollectionData';
import { CollectionFilters, parseUnifiedSearch } from '@/app/lib/hooks/useCollectionFilters';
import { SortFieldDef, useFilterSort } from '@/app/lib/hooks/useFilterSort';
import { NotInCollectionEntry, useNotInCollection } from '@/app/lib/hooks/useNotInCollection';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { useCallback, useMemo } from 'react';

export type NotInCollectionSortField = 'name' | 'lastScanned';

type UseNotInCollectionFilterOptions = {
    status: CollectionLoadStatus;
    collectionItems: BggCollectionItem[];
    filters: Pick<CollectionFilters, 'searchText' | 'searchMode'>;
};

const sortFields: SortFieldDef<NotInCollectionEntry, NotInCollectionSortField>[] = [
    {
        field: 'name',
        label: 'Name',
        compare: (a, b) => (a.gameName ?? a.upc).localeCompare(b.gameName ?? b.upc),
    },
    {
        field: 'lastScanned',
        label: 'Last Scanned',
        compare: (a, b) => a.timestamp - b.timestamp,
    },
];

/** Scanned games that aren't in the loaded collection, filtered by the shared search box and sorted. */
export const useNotInCollectionFilter = ({ status, collectionItems, filters }: UseNotInCollectionFilterOptions) => {
    const { scanHistory } = useScanHistory();
    const isCollectionReady = status === CollectionLoadStatuses.LOADED || status === CollectionLoadStatuses.EMPTY;

    const collectionObjectIds = useMemo(
        () => isCollectionReady
              ? new Set(collectionItems?.map(item => item.objectId) ?? [])
              : undefined,
        [isCollectionReady, collectionItems],
    );

    const { notInCollectionItems, collectionHasData } = useNotInCollection(
        collectionObjectIds,
        scanHistory,
        isCollectionReady,
    );

    const { searchText, searchMode } = filters;
    const extraFilterFn = useCallback(
        (item: NotInCollectionEntry): boolean => {
            if (!searchText.trim() || searchMode === 'tags') { return true; }
            const { nameQuery, anyTextQuery } = parseUnifiedSearch(searchText, searchMode);
            const query = nameQuery || anyTextQuery;
            if (!query) { return true; }
            return (item.gameName ?? item.upc).toLowerCase().includes(query);
        },
        [searchText, searchMode],
    );

    const filter = useFilterSort<NotInCollectionEntry, NotInCollectionSortField>({
        items: notInCollectionItems,
        filterFn: () => true,
        extraFilterFn,
        sortFields,
        defaultSortField: 'name',
        storageKeyPrefix: 'collection-not-in',
    });

    return {
        filter,
        sortFields,
        notInCollectionItems,
        collectionHasData,
        scanHistoryLength: scanHistory.length,
    };
};

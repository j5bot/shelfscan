import { useBggSearch } from '@/app/lib/hooks/useBggSearch';
import { SearchMode } from '@/app/lib/hooks/useCollectionFilters';
import { BggCollection, BggCollectionItem, BggSearchSubType } from '@/app/lib/types/bgg';
import { getBggSearchQuery, prepareBggSearchResults } from '@/app/lib/utils/bggSearch';
import { useCallback, useMemo } from 'react';

export type UseCollectionBggSearchOptions = {
    searchText: string;
    searchMode: SearchMode;
    // the collection is loaded and its filtered list is empty
    enabled: boolean;
    collection: BggCollection | undefined;
    isShownIgnoringName: (item: BggCollectionItem) => boolean;
    // limits results to board games or expansions (the games and expansions toggle)
    subType: BggSearchSubType | undefined;
};

const EMPTY_OBJECTS = {};

/** BGG search for the collection page: what the search box finds on BGG, matched to the user's collection. */
export const useCollectionBggSearch = (options: UseCollectionBggSearchOptions) => {
    const { searchText, searchMode, enabled, collection, isShownIgnoringName, subType } = options;

    const query = getBggSearchQuery(searchText, searchMode);
    const search = useBggSearch({ query, enabled });

    const items = collection?.items;
    const isShown = useCallback(
        (collectionId: number) => {
            const item = items?.[collectionId];
            return !!item && isShownIgnoringName(item);
        },
        [items, isShownIgnoringName],
    );

    const objects = collection?.objects.all ?? EMPTY_OBJECTS;
    const { results, source } = search;
    const prepared = useMemo(() => {
        const ofSubType = subType ? results.filter(result => result.subType === subType) : results;
        return prepareBggSearchResults(ofSubType, source ?? 'xmlapi', { objects, isShown });
    }, [results, source, subType, objects, isShown]);

    return { query, search, prepared };
};

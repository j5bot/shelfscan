import { getCollection } from '@/app/lib/database/database';
import { BggCollectionMap } from '@/app/lib/types/bgg';
import { useCallback, useEffect, useRef, useState } from 'react';

export const CollectionLoadStatuses = {
    LOADING: 'loading',
    EMPTY: 'empty',
    ERROR: 'error',
    LOADED: 'loaded',
} as const;

export type CollectionLoadStatus = typeof CollectionLoadStatuses[keyof typeof CollectionLoadStatuses];

export type CollectionLoadStatusData = { status: CollectionLoadStatus };

type UseCollectionDataOptions = {
    username: string | undefined;
    /** Called with items loaded from Dexie when they exist. Use this to populate Redux. */
    onLoaded?: (items: BggCollectionMap) => void;
};

type UseCollectionDataResult = {
    state: CollectionLoadStatusData;
    setState: (state: CollectionLoadStatusData) => void;
};

export const useCollectionData = ({ username, onLoaded }: UseCollectionDataOptions): UseCollectionDataResult => {
    const [state, setState] = useState<CollectionLoadStatusData>({ status: CollectionLoadStatuses.LOADING });
    const mountedRef = useRef(true);

    const loadCollection = useCallback(async () => {
        setState({ status: CollectionLoadStatuses.LOADING });
        try {
            const map = username ? await getCollection(username.toLowerCase()) : undefined;
            if (!mountedRef.current) { return; }
            if (!map || Object.keys(map).length === 0) {
                setState({ status: CollectionLoadStatuses.EMPTY });
                return;
            }
            onLoaded?.(map);
            setState({ status: CollectionLoadStatuses.LOADED });
        } catch {
            if (!mountedRef.current) { return; }
            setState({ status: CollectionLoadStatuses.ERROR });
        }
    }, [username, onLoaded]);

    useEffect(() => {
        mountedRef.current = true;
        loadCollection().then();
        return () => { mountedRef.current = false; };
    }, [loadCollection]);

    return { state, setState };
};

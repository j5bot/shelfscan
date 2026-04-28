import { getCollection } from '@/app/lib/database/database';
import { BggCollectionItem, BggCollectionMap } from '@/app/lib/types/bgg';
import { useCallback, useEffect, useRef, useState } from 'react';

export const CollectionLoadStatuses = {
    LOADING: 'loading',
    EMPTY: 'empty',
    ERROR: 'error',
    LOADED: 'loaded',
} as const;

export type CollectionLoadStatus = typeof CollectionLoadStatuses[keyof typeof CollectionLoadStatuses];

export type CollectionLoadStatusData = { status: CollectionLoadStatus; items?: BggCollectionItem[] | undefined };

type UseCollectionDataResult = {
    state: CollectionLoadStatusData;
    setState: (state: CollectionLoadStatusData) => void;
    loadCollection: () => Promise<void>;
};

export const useCollectionData = (username: string | undefined): UseCollectionDataResult => {
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
            setState({ status: CollectionLoadStatuses.LOADED, items: Object.values(map) });
        } catch {
            if (!mountedRef.current) { return; }
            setState({ status: CollectionLoadStatuses.ERROR });
        }
    }, [username]);

    useEffect(() => {
        mountedRef.current = true;
        loadCollection().then();
        return () => { mountedRef.current = false; };
    }, [loadCollection]);

    return { state, setState, loadCollection };
};

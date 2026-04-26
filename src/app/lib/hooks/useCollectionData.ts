import { getCollection } from '@/app/lib/database/database';
import { BggCollectionItem, BggCollectionMap } from '@/app/lib/types/bgg';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CollectionLoadStatus =
    | { status: 'loading' }
    | { status: 'empty' }
    | { status: 'error' }
    | { status: 'loaded'; items: BggCollectionItem[] };

type UseCollectionDataResult = {
    state: CollectionLoadStatus;
    setState: (state: CollectionLoadStatus) => void;
    loadCollection: () => Promise<void>;
};

export const useCollectionData = (username: string | undefined): UseCollectionDataResult => {
    const [state, setState] = useState<CollectionLoadStatus>({ status: 'loading' });
    const mountedRef = useRef(true);

    const loadCollection = useCallback(async () => {
        setState({ status: 'loading' });
        try {
            let map: BggCollectionMap | undefined;
            if (username) {
                map = await getCollection(username.toLowerCase());
            }
            if (!mountedRef.current) { return; }
            if (!map || Object.keys(map).length === 0) {
                setState({ status: 'empty' });
                return;
            }
            setState({ status: 'loaded', items: Object.values(map) });
        } catch {
            if (!mountedRef.current) { return; }
            setState({ status: 'error' });
        }
    }, [username]);

    useEffect(() => {
        mountedRef.current = true;
        loadCollection().then();
        return () => { mountedRef.current = false; };
    }, [loadCollection]);

    return { state, setState, loadCollection };
};

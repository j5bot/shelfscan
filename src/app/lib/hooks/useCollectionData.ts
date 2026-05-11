import { bggGetCollectionInner } from '@/app/lib/actions';
import { getCollection, setCollection } from '@/app/lib/database/database';
import { useDispatch, useSelector } from '@/app/lib/hooks/index';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { RootState } from '@/app/lib/redux/store';
import { getCollectionFromXml } from '@/app/lib/services/bgg/service';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

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
};

type UseCollectionDataResult = {
    reduxItems: BggCollectionItem[];
    state: CollectionLoadStatusData;
    setState: (state: CollectionLoadStatusData) => void;
    isRefreshing: boolean;
    refreshError: string | null;
    announceText: string;
    clearRefreshError: () => void;
    refreshCollection: () => void;
};

const emptyCollectionArray: BggCollectionItem[] = [];

export const useCollectionData = ({ username }: UseCollectionDataOptions): UseCollectionDataResult => {
    const dispatch = useDispatch();

    const [isRefreshing, startRefresh] = useTransition();

    const [state, setState] = useState<CollectionLoadStatusData>({ status: CollectionLoadStatuses.LOADING });
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [announceText, setAnnounceText] = useState('');

    const mountedRef = useRef(true);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reduxItems = useSelector((state: RootState) => {
        const items = state.bgg.collection.users[username?.toLowerCase() ?? '']?.items;
        return items ? Object.values(items) : emptyCollectionArray;
    });

    const loadCollection = useCallback(async () => {
        setState({ status: CollectionLoadStatuses.LOADING });
        try {
            const map = username ? await getCollection(username.toLowerCase()) : undefined;
            if (!mountedRef.current) { return; }
            if (!map || Object.keys(map).length === 0) {
                setState({ status: CollectionLoadStatuses.EMPTY });
                return;
            }
            dispatch(updateCollectionItems({ username: username!, items: map }));
            setState({ status: CollectionLoadStatuses.LOADED });
        } catch {
            if (!mountedRef.current) { return; }
            setState({ status: CollectionLoadStatuses.ERROR });
        }
    }, [username, dispatch]);

    useEffect(() => {
        mountedRef.current = true;
        loadCollection().then();
        return () => { mountedRef.current = false; };
    }, [loadCollection]);

    const clearRefreshError = useCallback(() => setRefreshError(null), []);

    const refreshCollection = useCallback(() => {
        if (!username || isRefreshing) { return; }
        setRefreshError(null);
        mountedRef.current = true;
        startRefresh(async () => {
            try {
                const xml = await bggGetCollectionInner(username, 0);
                const items = getCollectionFromXml(xml);
                if (!items || Object.keys(items).length === 0) {
                    if (mountedRef.current) {
                        setRefreshError('No collection data returned from BGG.');
                    }
                    return;
                }
                await setCollection(username.toLowerCase(), items);
                if (!mountedRef.current) { return; }

                dispatch(updateCollectionItems({ username, items }));
                setState({ status: CollectionLoadStatuses.LOADED });
                setAnnounceText('Collection refreshed successfully.');
                if (refreshTimerRef.current !== null) {
                    clearTimeout(refreshTimerRef.current);
                }
                refreshTimerRef.current = setTimeout(() => {
                    refreshTimerRef.current = null;
                    if (mountedRef.current) {
                        setAnnounceText('');
                    }
                }, 3000);
            } catch {
                if (mountedRef.current) {
                    setRefreshError('Error refreshing collection. Please try again.');
                }
            }
        });
    }, [username, isRefreshing, dispatch]);

    return {
        reduxItems,
        state,
        setState,
        isRefreshing,
        refreshError,
        announceText,
        clearRefreshError,
        refreshCollection,
    };
};

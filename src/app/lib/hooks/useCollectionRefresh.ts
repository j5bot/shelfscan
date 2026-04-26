import { bggGetCollectionInner } from '@/app/lib/actions';
import { setCollection } from '@/app/lib/database/database';
import { getCollectionFromXml } from '@/app/lib/services/bgg/service';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { useCallback, useRef, useState, useTransition } from 'react';

type UseCollectionRefreshOptions = {
    username: string | undefined;
    onSuccess: (items: BggCollectionItem[]) => void;
};

type UseCollectionRefreshResult = {
    isRefreshing: boolean;
    refreshError: string | null;
    announceText: string;
    clearRefreshError: () => void;
    refreshCollection: () => void;
};

export const useCollectionRefresh = ({
    username,
    onSuccess,
}: UseCollectionRefreshOptions): UseCollectionRefreshResult => {
    const [isRefreshing, startRefresh] = useTransition();
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [announceText, setAnnounceText] = useState('');
    const mountedRef = useRef(true);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                onSuccess(Object.values(items));
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
    }, [username, isRefreshing, onSuccess]);

    return { isRefreshing, refreshError, announceText, clearRefreshError, refreshCollection };
};

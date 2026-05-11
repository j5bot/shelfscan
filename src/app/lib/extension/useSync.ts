import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useLayoutEffect, useRef } from 'react';

export const useSync = () => {
    const syncOnRef = useRef<boolean>(false);

    const userId = useSelector(
        (state: RootState) => state.bgg.user?.id,
    );

    const currentUsername = useSelector(
        (state: RootState) => state.bgg.user?.user,
    );

    useLayoutEffect(() => {
        const newValue = document.cookie.includes('shelfScanExtension') ||
            document.body.getAttribute('data-shelfscan-sync') === 'on';
        if (syncOnRef.current === newValue) {
            return;
        }
        syncOnRef.current = newValue;
    }, []);

    return {
        syncOn: syncOnRef.current,
        userId,
        currentUsername,
    };
};

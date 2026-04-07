import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useLayoutEffect, useState } from 'react';

export const useSync = () => {
    const [syncOn, setSyncOn] = useState<boolean>(false);

    const userId = useSelector(
        (state: RootState) => state.bgg.user?.id,
    );

    const currentUsername = useSelector(
        (state: RootState) => state.bgg.user?.user,
    );

    useLayoutEffect(() => {
        const newValue = document.cookie.includes('shelfScanExtension') ||
            document.body.getAttribute('data-shelfscan-sync') === 'on';
        if (syncOn === newValue) {
            return;
        }
        setSyncOn(newValue);
    });

    return {
        syncOn,
        userId,
        currentUsername,
    };
};

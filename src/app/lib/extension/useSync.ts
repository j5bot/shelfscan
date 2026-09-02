import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useLayoutEffect, useMemo, useState } from 'react';

export const useSync = () => {
    const [syncOn, setSyncOn] = useState<boolean>(false);
    const [hasSubscription, setHasSubscription] = useState<boolean>();

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
        if (newValue) {
            document.getElementById('get-extension-link')?.classList.add('animate-fade');
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSyncOn(newValue);
    }, [syncOn]);

    useLayoutEffect(() => {
        const subscription = document.cookie.includes('shelfScanSubscription=true');

        if (subscription === hasSubscription) {
            return;
        }
        document.getElementById('subscribe-banner')?.classList.add('hidden');

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasSubscription(subscription);
    }, [hasSubscription]);

    return useMemo(() => ({
        syncOn,
        hasSubscription,
        userId,
        currentUsername,
    }), [syncOn, hasSubscription, userId, currentUsername]);
};

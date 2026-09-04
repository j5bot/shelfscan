import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import posthog from 'posthog-js';
import { useLayoutEffect, useMemo, useState } from 'react';

const fadeInClasses = 'flex transition-opacity opacity-100 duration-800'
    .split(' ');

export const useSync = () => {
    const [syncOn, setSyncOn] = useState<boolean | null>(null);
    const [hasSubscription, setHasSubscription] = useState<boolean>();

    const userId = useSelector(
        (state: RootState) => state.bgg.user?.id,
    );

    const currentUsername = useSelector(
        (state: RootState) => state.bgg.user?.user,
    );

    const handleExtensionLink = () => {
        const newValue = document.cookie.includes('shelfScanExtension') ||
                         document.body.getAttribute('data-shelfscan-sync') === 'on';

        if (syncOn === newValue) {
            return;
        }

        const extLink = document.getElementById('get-extension-link');
        if (extLink) {
            if (!newValue) {
                extLink.classList.remove('hidden');
            }
            extLink.classList.add(...(newValue ? ['animate-fade'] : fadeInClasses));
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSyncOn(newValue);
    };

    const handleSubscribeBanner = () => {
        const subscription = document.cookie
            .includes('shelfScanSubscription=true');

        if (subscription === hasSubscription) {
            return;
        }
        const banner = document.getElementById('subscribe-banner');
        if (!subscription && banner) {
            banner.classList.remove('hidden');
            banner.classList.add(...fadeInClasses);
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasSubscription(subscription);
    };

    useLayoutEffect(() => {
        setTimeout(handleExtensionLink, 1000);
    }, [syncOn]);

    useLayoutEffect(() => {
        setTimeout(handleSubscribeBanner, 1000);
    }, [hasSubscription]);

    return useMemo(() => {
        if (userId && currentUsername) {
            posthog.capture('extension-check', {
                extension: syncOn,
                subscription: hasSubscription,
            });
        }
        return {
            syncOn: !!syncOn,
                hasSubscription,
                userId,
                currentUsername,
        };
    }, [syncOn, hasSubscription, userId, currentUsername]);
};

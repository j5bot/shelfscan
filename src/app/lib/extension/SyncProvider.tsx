import { SyncContext } from '@/app/lib/extension/SyncContext';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import posthog from 'posthog-js';
import { ReactNode, useEffectEvent, useLayoutEffect, useMemo, useState } from 'react';

const fadeInClasses = 'flex transition-opacity opacity-100 duration-800'
    .split(' ');

export const SyncProvider = ({ children }: { children: ReactNode }) => {
    const [syncOn, setSyncOn] = useState<boolean | null>(null);
    const [hasSubscription, setHasSubscription] = useState<boolean>();

    const userId = useSelector(
        (state: RootState) => state.bgg.user?.id,
    );

    const currentUsername = useSelector(
        (state: RootState) => state.bgg.user?.user,
    );

    const handleExtensionLink = useEffectEvent(() => {
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

        setSyncOn(newValue);
    });

    const handleSubscribeBanner = useEffectEvent(() => {
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

        setHasSubscription(subscription);
    });

    useLayoutEffect(() => {
        const timeoutId = setTimeout(() => handleExtensionLink(), 1000);
        return () => clearTimeout(timeoutId);
    }, [syncOn]);

    useLayoutEffect(() => {
        const timeoutId = setTimeout(() => handleSubscribeBanner(), 1000);
        return () => clearTimeout(timeoutId);
    }, [hasSubscription]);

    const value = useMemo(() => {
        if (userId && currentUsername && syncOn !== null && hasSubscription !== undefined) {
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

    return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

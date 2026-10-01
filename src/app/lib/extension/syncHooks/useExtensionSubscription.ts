import { fadeInClasses } from '@/app/lib/extension/utils';
import { useEffectEvent, useLayoutEffect, useState } from 'react';

// undefined until the first check has run
export const useExtensionSubscription = () => {
    const [hasSubscription, setHasSubscription] = useState<boolean>();

    // returns true once a subscription is found, so observing can stop
    const checkSubscription = useEffectEvent(() => {
        const subscription = document.body.dataset.shelfscanSubscription === 'true' ||
                             document.cookie.includes('shelfScanSubscription=true');

        if (subscription !== hasSubscription) {
            const banner = document.getElementById('subscribe-banner');
            if (!subscription && banner) {
                banner.classList.remove('hidden');
                banner.classList.add(...fadeInClasses);
            }
            setHasSubscription(subscription);
        }

        return subscription;
    });

    useLayoutEffect(() => {
        const observer = new MutationObserver(() => {
            if (checkSubscription()) {
                observer.disconnect();
            }
        });
        // dataset.shelfscanSubscription is the data-shelfscan-subscription attribute
        observer.observe(document.body, { attributeFilter: ['data-shelfscan-subscription'] });
        // the attribute (or cookie) may already be set before this mounted;
        // checked on the next frame because the check sets state
        const frameId = requestAnimationFrame(() => {
            if (checkSubscription()) {
                observer.disconnect();
            }
        });
        return () => {
            cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, []);

    return hasSubscription;
};

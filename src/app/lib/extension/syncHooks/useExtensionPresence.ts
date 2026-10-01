import { fadeInClasses } from '@/app/lib/extension/utils';
import { useEffectEvent, useLayoutEffect, useState } from 'react';

// the extension adds this hidden BGG iframe on ShelfScan pages and relays every message through it,
// so its presence means messages can actually be delivered (the extension's cookies outlive it)
const BGG_IFRAME_ID = '__bggIframe__';

// null until the first check has run
export const useExtensionPresence = () => {
    const [syncOn, setSyncOn] = useState<boolean | null>(null);

    // returns true once the extension is found, so observing can stop
    const checkExtension = useEffectEvent(() => {
        const newValue = !!document.getElementById(BGG_IFRAME_ID) ||
                         document.body.getAttribute('data-shelfscan-sync') === 'on';

        if (syncOn !== newValue) {
            const extLink = document.getElementById('get-extension-link');
            if (extLink) {
                if (!newValue) {
                    extLink.classList.remove('hidden');
                }
                extLink.classList.add(...(newValue ? ['animate-fade'] : fadeInClasses));
            }
            setSyncOn(newValue);
        }

        return newValue;
    });

    useLayoutEffect(() => {
        const observer = new MutationObserver(() => {
            if (checkExtension()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
        // the extension may have added its iframe before this mounted;
        // checked on the next frame because the check sets state
        const frameId = requestAnimationFrame(() => {
            if (checkExtension()) {
                observer.disconnect();
            }
        });
        return () => {
            cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, []);

    return syncOn;
};

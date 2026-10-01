import { useEffectEvent, useLayoutEffect, useState } from 'react';

// the BGG username the extension reports, undefined until it sets one
export const useExtensionUser = () => {
    const [extensionUser, setExtensionUser] = useState<string>();

    const checkUser = useEffectEvent(() => {
        const user = document.body.dataset.shelfscanBggUsername || undefined;

        if (user !== extensionUser) {
            setExtensionUser(user);
        }
    });

    useLayoutEffect(() => {
        const observer = new MutationObserver(() => checkUser());
        // dataset.shelfscanBggUsername is the data-shelfscan-bgg-username attribute;
        // the user can log in or out of BGG or switch accounts, so this stays connected
        observer.observe(document.body, { attributeFilter: ['data-shelfscan-bgg-username'] });
        // the attribute may already be set before this mounted;
        // checked on the next frame because the check sets state
        const frameId = requestAnimationFrame(() => checkUser());
        return () => {
            cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, []);

    return extensionUser;
};

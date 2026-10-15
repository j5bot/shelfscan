import { ExtensionVersion, parseExtensionVersion } from '@/app/lib/utils/extensionVersion';
import { useEffect, useState } from 'react';

// the extension renders its version (e.g. `v0.12.0 (1a2b3c4)`) in its shadow root
const readExtensionVersion = (): ExtensionVersion | undefined => {
    const versionEl = document.getElementById('extension-root')?.shadowRoot
        ?.querySelector('.shelfscan-modal-box .text-xs.mt-3');
    return versionEl instanceof HTMLElement ? parseExtensionVersion(versionEl.innerHTML) : undefined;
};

/** The installed extension's version; null until it's found (or when there is no extension). */
export const useExtensionVersion = (syncOn: boolean | null) => {
    const [version, setVersion] = useState<ExtensionVersion | null>(null);

    const found = version !== null;
    useEffect(() => {
        if (!syncOn || found) {
            return;
        }

        const check = () => {
            const current = readExtensionVersion();
            if (current) {
                setVersion(current);
                observer.disconnect();
            }
        };
        const observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });
        // the extension may have rendered before this mounted; checked on the next frame because the check sets state
        const frameId = requestAnimationFrame(check);

        return () => {
            cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, [syncOn, found]);

    return syncOn ? version : null;
};

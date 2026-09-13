import { useSync } from '@/app/lib/extension/useSync';
import { useLayoutEffect, useRef, useState } from 'react';

const EXTENSION_VERSION_PATTERN = /^v(?<version>\S+) \((?<hash>[^)]+)\)$/;

type ExtensionVersionInfo = {
    version: string;
    hash: string;
};

const latestVersion = '0.10.2';
const requiredUpdate = true;

export const ExtensionNotice = () => {
    const { syncOn } = useSync();
    const mutationObserverRef = useRef<MutationObserver>(null);

    const [versionInfo, setVersionInfo] = useState<ExtensionVersionInfo | null>(null);
    const [dismissed, setDismissed] = useState<boolean>(false);

    const getVersionInfo = () => {
        const extensionRoot = document.getElementById('extension-root');
        const versionEl = extensionRoot?.shadowRoot
            ?.querySelector('.shelfscan-modal-box .text-xs.mt-3');

        if (!(versionEl instanceof HTMLElement)) {
            return;
        }

        const match = versionEl.innerHTML.trim().match(EXTENSION_VERSION_PATTERN);
        if (!match?.groups) {
            return;
        }

        setVersionInfo({
            version: match.groups.version,
            hash: match.groups.hash,
        })

        mutationObserverRef.current?.disconnect();
    };

    useLayoutEffect(() => {
        if (!syncOn) {
            return;
        }
        if (mutationObserverRef.current) {
            return;
        }
        mutationObserverRef.current = new MutationObserver(getVersionInfo);
        mutationObserverRef.current.observe(document.body, { childList: true, subtree: true });
    }, [syncOn]);

    const updateAvailable = syncOn && latestVersion !== versionInfo?.version;

    return versionInfo?.version && updateAvailable && !dismissed ? (
        <div className="toast toast-top toast-center z-50">
            <div role="alert" className="alert alert-warning shadow-lg">
                <span className="text-sm">
                    {requiredUpdate
                        ? `A required update (v${latestVersion}) to the ShelfScan extension is available`
                        : `An update (v${latestVersion} to the ShelfScan extension is available`}
                </span>
                <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setDismissed(true)}
                >
                    ✕
                </button>
            </div>
        </div>
    ) : null;
};

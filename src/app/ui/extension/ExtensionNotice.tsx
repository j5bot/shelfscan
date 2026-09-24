import { useSync } from '@/app/lib/extension/useSync';
import latest from '@/app/lib/extension/version';
import { useLayoutEffect, useRef, useState } from 'react';

const EXTENSION_VERSION_PATTERN = /^v(?<version>\S+) \((?<hash>[^)]+)\)$/;

const { version: latestVersion, requiredUpdate } = latest;
const [latestMajorSegment, latestMinorSegment, latestPatchSegment] = latestVersion.split('.');
const latestMajor = parseInt(latestMajorSegment, 10);
const latestMinor = parseInt(latestMinorSegment, 10);
const latestPatch = parseInt(latestPatchSegment, 10);

type ExtensionVersionInfo = {
    version: string;
    major: number;
    minor: number;
    patch: number;
    hash: string;
};

const isVersionOutdated = (info: ExtensionVersionInfo): boolean => {
    switch (true) {
        case info.major !== latestMajor:
            return info.major < latestMajor;
        case info.minor !== latestMinor:
            return info.minor < latestMinor;
        default:
            return info.patch < latestPatch;
    }
};

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

        const versionSegments = match.groups.version?.split('.');
        const [major, minor, patch] = versionSegments ?? [];

        setVersionInfo({
            version: match.groups.version,
            major: parseInt(major, 10),
            minor: parseInt(minor, 10),
            patch: parseInt(patch, 10),
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
        const observer = new MutationObserver(getVersionInfo);
        mutationObserverRef.current = observer;
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObserverRef.current = null;
        };
    }, [syncOn]);

    const updateAvailable = !!(syncOn && versionInfo && isVersionOutdated(versionInfo));

    return updateAvailable && !dismissed && (
        <div className="toast toast-top toast-center z-50">
            <div role="alert" className="alert alert-warning shadow-lg">
                <span className="text-sm">
                    {requiredUpdate === 'true'
                        ? `A required update (v${latestVersion}) to the ShelfScan extension is available`
                        : `An update (v${latestVersion}) to the ShelfScan extension is available`}
                </span>
                <button
                    className="btn btn-sm btn-ghost"
                    aria-label="Dismiss"
                    onClick={() => setDismissed(true)}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

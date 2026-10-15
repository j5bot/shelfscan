import { useSync } from '@/app/lib/extension/useSync';
import latest from '@/app/lib/extension/version';
import { isVersionAtLeast } from '@/app/lib/utils/extensionVersion';
import { useState } from 'react';

const { version: latestVersion, requiredUpdate } = latest;

export const ExtensionNotice = () => {
    const { syncOn, extensionVersion } = useSync();
    const [dismissed, setDismissed] = useState<boolean>(false);

    const updateAvailable = !!(syncOn && extensionVersion && !isVersionAtLeast(extensionVersion, latestVersion));

    return updateAvailable && !dismissed && (
        <div className="toast toast-top toast-center z-50">
            <div role="alert" className="alert alert-warning shadow-lg">
                <span className="text-sm">
                    {requiredUpdate === 'true'
                        ? `A required update (v${latestVersion}) to the ShelfScan extension is available`
                        : `An update (v${latestVersion}) to the ShelfScan extension is available`}
                </span>
                <button
                    type="button"
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

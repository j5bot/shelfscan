import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { DismissibleToast } from '@/app/ui/DismissibleToast';
import React from 'react';

type ScanToastsProps = {
    duplicateUpc: string | null;
    historyLimitReached: boolean;
    onClearDuplicate: () => void;
    onClearLimitReached: () => void;
};

export const ScanToasts = (props: ScanToastsProps) => {
    const { duplicateUpc, historyLimitReached, onClearDuplicate, onClearLimitReached } = props;

    const { clearHistory, scanError, clearScanError } = useScanHistory();

    return <>
        {duplicateUpc && (
            <DismissibleToast kind="warning" onDismiss={onClearDuplicate}>
                <span className="text-sm">
                    Already scanned <span className="font-mono">{duplicateUpc}</span> recently — duplicate not recorded.
                </span>
            </DismissibleToast>
        )}
        {historyLimitReached && (
            <div className="toast toast-top toast-center z-50">
                <div role="alert" className="alert alert-error shadow-lg">
                    <span className="text-sm">
                        Scan history is full (20,000 entries). Clear history to continue recording scans.
                    </span>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                            void clearHistory();
                            onClearLimitReached();
                        }}
                    >
                        Clear History
                    </button>
                    <button
                        className="btn btn-sm btn-ghost"
                        aria-label="Dismiss"
                        onClick={onClearLimitReached}
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}
        {scanError && (
            <DismissibleToast kind="error" onDismiss={clearScanError}>
                <span className="text-sm">
                    Scan history error: {scanError}
                </span>
            </DismissibleToast>
        )}
    </>;
};


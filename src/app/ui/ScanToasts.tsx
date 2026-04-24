'use client';

import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import React from 'react';

type ScanToastsProps = {
    duplicateUpc: string | null;
    historyLimitReached: boolean;
    onClearDuplicate: () => void;
    onClearLimitReached: () => void;
};

export const ScanToasts = ({
    duplicateUpc,
    historyLimitReached,
    onClearDuplicate,
    onClearLimitReached,
}: ScanToastsProps) => {
    const { clearHistory, scanError, clearScanError } = useScanHistory();

    return <>
        {duplicateUpc && (
            <div className="toast toast-top toast-center z-50" onClick={onClearDuplicate}>
                <div role="alert" className="alert alert-warning shadow-lg cursor-pointer">
                    <span className="text-sm">
                        Already scanned <span className="font-mono">{duplicateUpc}</span> recently — duplicate not recorded.
                    </span>
                </div>
            </div>
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
                        onClick={onClearLimitReached}
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}
        {scanError && (
            <div className="toast toast-top toast-center z-50" onClick={clearScanError}>
                <div role="alert" className="alert alert-error shadow-lg cursor-pointer">
                    <span className="text-sm">
                        Scan history error: {scanError}
                    </span>
                </div>
            </div>
        )}
    </>;
};


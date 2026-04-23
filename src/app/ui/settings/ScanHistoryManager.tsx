import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { useState } from 'react';

export const ScanHistoryManager = () => {
    const { scanHistory, clearHistory, associateScans, scanError, clearScanError } = useScanHistory();
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    const [associateStatus, setAssociateStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [associatedCount, setAssociatedCount] = useState<number>(0);
    const [clearStatus, setClearStatus] = useState<'idle' | 'pending' | 'error'>('idle');

    const anonymousCount = scanHistory.filter(e => !e.username).length;

    const handleAssociate = async () => {
        if (!currentUsername) {
            return;
        }
        setAssociateStatus('pending');
        try {
            const count = await associateScans(currentUsername);
            setAssociatedCount(count);
            setAssociateStatus('success');
        } catch {
            setAssociateStatus('error');
        }
    };

    const handleClearHistory = async () => {
        setClearStatus('pending');
        await clearHistory();
        if (scanError) {
            setClearStatus('error');
        } else {
            setClearStatus('idle');
            setAssociateStatus('idle');
            setAssociatedCount(0);
        }
    };

    return <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
        <input type="radio" name="settings" />
        <h3 className="collapse-title font-semibold">Scan History</h3>
        <div className="collapse-content text-xs">
            <div className="p-1 flex flex-col gap-2">
                <p className="text-balance">
                    ShelfScan records each barcode you scan locally so you can review unmatched
                    scans later. This data never leaves your device.
                </p>
                <p>Recorded scans: <strong>{scanHistory.length}</strong></p>
                {currentUsername && anonymousCount > 0 && (
                    <div className="flex flex-col gap-2">
                        <p>
                            Anonymous scans (no account): <strong>{anonymousCount}</strong>
                        </p>
                        <p className="text-balance text-base-content/70">
                            You can associate these scans with your BGG account so they appear
                            in your history.
                        </p>
                        <button
                            className="btn btn-sm btn-primary w-fit"
                            onClick={() => void handleAssociate()}
                            disabled={associateStatus === 'pending' || associateStatus === 'success'}
                        >
                            {associateStatus === 'pending'
                                ? <span className="loading loading-spinner loading-xs" />
                                : `Associate with ${currentUsername}`}
                        </button>
                        {associateStatus === 'success' && (
                            <p className="text-success">
                                {associatedCount} scan{associatedCount !== 1 ? 's' : ''} associated with <strong>{currentUsername}</strong>.
                            </p>
                        )}
                        {associateStatus === 'error' && (
                            <p className="text-error">
                                Association failed. Please try again.
                            </p>
                        )}
                    </div>
                )}
                {currentUsername && anonymousCount === 0 && associateStatus === 'success' && (
                    <p className="text-success">
                        All scans are associated with <strong>{currentUsername}</strong>.
                    </p>
                )}
            </div>
            {scanError && (
                <div role="alert" className="alert alert-error text-xs mt-2 py-2">
                    <span>Error: {scanError}</span>
                    <button className="btn btn-xs btn-ghost" onClick={clearScanError}>✕</button>
                </div>
            )}
            <p className="mt-2">
                <button
                    className="btn btn-warning"
                    disabled={clearStatus === 'pending'}
                    onClick={() => void handleClearHistory()}
                >
                    {clearStatus === 'pending'
                        ? <span className="loading loading-spinner loading-xs" />
                        : 'Clear Scan History'}
                </button>
                {clearStatus === 'error' && (
                    <span className="text-error ml-2 text-xs">Failed to clear. Please try again.</span>
                )}
            </p>
        </div>
    </div>;
};

import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { useState } from 'react';

export const ScanHistoryManager = () => {
    const { scanHistory, clearHistory, associateScans } = useScanHistory();
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    const [associateStatus, setAssociateStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [associatedCount, setAssociatedCount] = useState<number>(0);

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
            <p className="mt-2">
                <button className="btn btn-warning" onClick={() => {
                    clearHistory().then();
                    setAssociateStatus('idle');
                    setAssociatedCount(0);
                }}>
                    Clear Scan History
                </button>
            </p>
        </div>
    </div>;
};

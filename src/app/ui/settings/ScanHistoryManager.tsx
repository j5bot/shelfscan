import { useScanHistory } from '@/app/lib/ScanHistoryProvider';

export const ScanHistoryManager = () => {
    const { scanHistory, clearHistory } = useScanHistory();

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
            </div>
            <p className="mt-2">
                <button className="btn btn-warning" onClick={() => {
                    clearHistory().then();
                }}>
                    Clear Scan History
                </button>
            </p>
        </div>
    </div>;
};

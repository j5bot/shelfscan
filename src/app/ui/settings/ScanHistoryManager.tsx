import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { useRef, useState } from 'react';
import { FaDownload, FaUpload } from 'react-icons/fa6';

export const ScanHistoryManager = () => {
    const { scanHistory, clearHistory, associateScans, exportHistory, importHistory, scanError, clearScanError } = useScanHistory();
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    const [associateStatus, setAssociateStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [associatedCount, setAssociatedCount] = useState<number>(0);
    const [clearStatus, setClearStatus] = useState<'idle' | 'pending' | 'error'>('idle');
    const [exportStatus, setExportStatus] = useState<'idle' | 'pending' | 'error'>('idle');
    const [importStatus, setImportStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [importedCount, setImportedCount] = useState<number>(0);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const success = await clearHistory();
        if (!success) {
            setClearStatus('error');
        } else {
            setClearStatus('idle');
            setAssociateStatus('idle');
            setAssociatedCount(0);
        }
    };

    const handleExport = async () => {
        setExportStatus('pending');
        try {
            await exportHistory();
            setExportStatus('idle');
        } catch {
            setExportStatus('error');
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!fileInputRef.current) { return; }
        fileInputRef.current.value = '';
        if (!file) { return; }

        if (
            scanHistory.length > 0 &&
            !window.confirm(
                `This will replace all ${scanHistory.length} existing scan${scanHistory.length !== 1 ? 's' : ''}. Continue?`,
            )
        ) {
            return;
        }

        setImportStatus('pending');
        setImportError(null);
        try {
            const { count } = await importHistory(file);
            setImportedCount(count);
            setImportStatus('success');
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Import failed.');
            setImportStatus('error');
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
                <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={e => void handleImportFile(e)}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    <button
                        className="btn btn-sm btn-outline"
                        disabled={exportStatus === 'pending' || scanHistory.length === 0}
                        onClick={() => void handleExport()}
                    >
                        {exportStatus === 'pending'
                            ? <span className="loading loading-spinner loading-xs" />
                            : <><FaDownload /> Download</>}
                    </button>
                    <button
                        className="btn btn-sm btn-outline"
                        disabled={importStatus === 'pending'}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {importStatus === 'pending'
                            ? <span className="loading loading-spinner loading-xs" />
                            : <><FaUpload /> Import</>}
                    </button>
                </div>
                {exportStatus === 'error' && (
                    <p className="text-error text-xs mt-1">Export failed. Please try again.</p>
                )}
                {importStatus === 'success' && (
                    <p className="text-success text-xs mt-1">Imported {importedCount} scan{importedCount !== 1 ? 's' : ''}.</p>
                )}
                {importStatus === 'error' && (
                    <p className="text-error text-xs mt-1">{importError ?? 'Import failed. Please try again.'}</p>
                )}
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

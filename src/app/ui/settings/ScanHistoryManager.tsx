import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import React, { useRef, useState } from 'react';
import { FaDownload, FaUpload } from 'react-icons/fa6';

type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

const spinner = <span className="loading loading-spinner loading-xs" />;
const plural = (count: number, noun: string) => `${count} ${noun}${count !== 1 ? 's' : ''}`;

type AssociateScansProps = {
    currentUsername: string;
    anonymousCount: number;
};

const AssociateScans = ({ currentUsername, anonymousCount }: AssociateScansProps) => {
    const { associateScans } = useScanHistory();
    const [status, setStatus] = useState<AsyncStatus>('idle');
    const [associatedCount, setAssociatedCount] = useState<number>(0);

    const handleAssociate = async () => {
        setStatus('pending');
        try {
            setAssociatedCount(await associateScans(currentUsername));
            setStatus('success');
        } catch {
            setStatus('error');
        }
    };

    if (anonymousCount === 0) {
        return status === 'success' && (
            <p className="text-success">
                All scans are associated with <strong>{currentUsername}</strong>.
            </p>
        );
    }

    return <div className="flex flex-col gap-2">
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
            disabled={status === 'pending' || status === 'success'}
        >
            {status === 'pending' ? spinner : `Associate with ${currentUsername}`}
        </button>
        {status === 'success' && (
            <p className="text-success">
                {plural(associatedCount, 'scan')} associated with <strong>{currentUsername}</strong>.
            </p>
        )}
        {status === 'error' && (
            <p className="text-error">
                Association failed. Please try again.
            </p>
        )}
    </div>;
};

const BackupControls = () => {
    const { scanHistory, exportHistory, importHistory } = useScanHistory();
    const [exportStatus, setExportStatus] = useState<AsyncStatus>('idle');
    const [importStatus, setImportStatus] = useState<AsyncStatus>('idle');
    const [importedCount, setImportedCount] = useState<number>(0);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            !window.confirm(`This will replace all ${plural(scanHistory.length, 'existing scan')}. Continue?`)
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

    return <>
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
                {exportStatus === 'pending' ? spinner : <><FaDownload /> Download</>}
            </button>
            <button
                className="btn btn-sm btn-outline"
                disabled={importStatus === 'pending'}
                onClick={() => fileInputRef.current?.click()}
            >
                {importStatus === 'pending' ? spinner : <><FaUpload /> Import</>}
            </button>
        </div>
        {exportStatus === 'error' && (
            <p className="text-error text-xs mt-1">Export failed. Please try again.</p>
        )}
        {importStatus === 'success' && (
            <p className="text-success text-xs mt-1">Imported {plural(importedCount, 'scan')}.</p>
        )}
        {importStatus === 'error' && (
            <p className="text-error text-xs mt-1">{importError ?? 'Import failed. Please try again.'}</p>
        )}
    </>;
};

const ClearHistoryButton = ({ onCleared }: { onCleared: () => void }) => {
    const { clearHistory } = useScanHistory();
    const [status, setStatus] = useState<AsyncStatus>('idle');

    const handleClearHistory = async () => {
        setStatus('pending');
        const success = await clearHistory();
        setStatus(success ? 'idle' : 'error');
        if (success) {
            onCleared();
        }
    };

    return <p className="mt-2">
        <button
            className="btn btn-warning"
            disabled={status === 'pending'}
            onClick={() => void handleClearHistory()}
        >
            {status === 'pending' ? spinner : 'Clear Scan History'}
        </button>
        {status === 'error' && (
            <span className="text-error ml-2 text-xs">Failed to clear. Please try again.</span>
        )}
    </p>;
};

export const ScanHistoryManager = () => {
    const { scanHistory, scanError, clearScanError } = useScanHistory();
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    // bumped after clearing history so the association section starts fresh
    const [clearGeneration, setClearGeneration] = useState<number>(0);

    const anonymousCount = scanHistory.filter(e => !e.username).length;

    return <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
        <input type="radio" name="settings" aria-labelledby="settings-scan-history" />
        <h3 className="collapse-title font-semibold" id="settings-scan-history">Scan History</h3>
        <div className="collapse-content text-xs">
            <div className="p-1 flex flex-col gap-2">
                <p className="text-balance">
                    ShelfScan records each barcode you scan locally so you can review unmatched
                    scans later. This data never leaves your device.
                </p>
                <p>Recorded scans: <strong>{scanHistory.length}</strong></p>
                {currentUsername && (
                    <AssociateScans
                        key={clearGeneration}
                        currentUsername={currentUsername}
                        anonymousCount={anonymousCount}
                    />
                )}
            </div>
            <BackupControls />
            {scanError && (
                <div role="alert" className="alert alert-error text-xs mt-2 py-2">
                    <span>Error: {scanError}</span>
                    <button className="btn btn-xs btn-ghost" aria-label="Dismiss error" onClick={clearScanError}>✕</button>
                </div>
            )}
            <ClearHistoryButton onCleared={() => setClearGeneration(generation => generation + 1)} />
        </div>
    </div>;
};

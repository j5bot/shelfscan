import {
    BackupTableName,
    INCLUDED_TABLES,
    TABLE_LABELS,
    exportBackup,
    importBackupFile,
    previewBackupFile,
} from '@/app/lib/utils/dbBackup';
import posthog from 'posthog-js';
import { ChangeEvent, useRef, useState } from 'react';
import { FaDownload, FaUpload, FaXmark } from 'react-icons/fa6';

type Status = 'idle' | 'pending' | 'success' | 'error';

const describeTables = (tables: { name: string; rowCount: number }[]): string =>
    tables
        .map(t => `${TABLE_LABELS[t.name as BackupTableName] ?? t.name} (${t.rowCount})`)
        .join(', ');

export const BackupManager = () => {
    const [exportStatus, setExportStatus] = useState<Status>('idle');
    const [importStatus, setImportStatus] = useState<Status>('idle');
    const [importMessage, setImportMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setExportStatus('pending');
        try {
            await exportBackup();
            posthog.capture('backup_exported');
            setExportStatus('idle');
        } catch (e) {
            setExportStatus('error');
            console.error(e);
        }
    };

    const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (!file) { return; }

        setImportStatus('pending');
        setImportMessage('');
        try {
            const preview = await previewBackupFile(file);
            const includedTables = preview.data.tables.filter(
                t => INCLUDED_TABLES.includes(t.name as BackupTableName),
            );

            if (
                !window.confirm(
                    `This will replace the following data on this device:\n\n${describeTables(includedTables)}\n\nContinue?`,
                )
            ) {
                setImportStatus('idle');
                return;
            }

            const { tables } = await importBackupFile(file);
            posthog.capture('backup_imported', {
                table_count: tables.length,
            });
            setImportMessage(`Imported: ${describeTables(tables)}.`);
            setImportStatus('success');
        } catch (err) {
            setImportMessage(err instanceof Error ? err.message : 'Import failed.');
            setImportStatus('error');
        }
    };

    const dismissMessage = () => {
        setImportStatus('idle');
        setImportMessage('');
    };

    return (
        <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
            <input type="radio" name="settings" />
            <h3 className="collapse-title font-semibold">Backup & Restore</h3>
            <div className="collapse-content text-xs flex flex-col gap-3">
                <p className="text-balance">
                    Export a full backup of your ShelfScan data (settings, plugins, collections,
                    data forms, scan history, and saved filters) as a PNG image file, or import a
                    previously exported backup.
                </p>

                <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={e => void handleImportFile(e)}
                />
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline gap-1"
                        disabled={exportStatus === 'pending'}
                        onClick={() => void handleExport()}
                    >
                        {exportStatus === 'pending'
                            ? <span className="loading loading-spinner loading-xs" />
                            : <><FaDownload size={11} aria-hidden="true" /> Export Backup</>}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline gap-1"
                        disabled={importStatus === 'pending'}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {importStatus === 'pending'
                            ? <span className="loading loading-spinner loading-xs" />
                            : <><FaUpload size={11} aria-hidden="true" /> Import Backup</>}
                    </button>
                </div>

                {exportStatus === 'error' && (
                    <p className="text-error">Export failed. Please try again.</p>
                )}

                {(importStatus === 'success' || importStatus === 'error') && (
                    <div className={`alert alert-xs gap-1 py-1.5 ${importStatus === 'success' ? 'alert-success' : 'alert-error'}`}>
                        <span className="flex-1 text-xs">{importMessage}</span>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={dismissMessage}
                            aria-label="Dismiss"
                        >
                            <FaXmark size={10} aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

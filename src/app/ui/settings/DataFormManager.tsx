import { database, DataFormEntity } from '@/app/lib/database/database';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { FaDownload, FaUpload, FaXmark } from 'react-icons/fa6';

type ImportState = 'idle' | 'success' | 'error';

export const DataFormManager = () => {
    const [forms, setForms] = useState<DataFormEntity[]>([]);
    const [importState, setImportState] = useState<ImportState>('idle');
    const [importMessage, setImportMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadForms = async () => {
        setForms(await database.dataforms.toArray());
    };

    useEffect(() => {
        loadForms().then();
    }, []);

    const handleExport = () => {
        const json = JSON.stringify(forms, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shelfscan-dataforms.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) { return; }

        try {
            const text = await file.text();
            const parsed: unknown = JSON.parse(text);

            if (!Array.isArray(parsed)) {
                throw new Error('Expected a JSON array of dataforms.');
            }

            const imported = parsed as DataFormEntity[];
            let added = 0;
            let updated = 0;

            for (const form of imported) {
                if (typeof form.name !== 'string' || typeof form.schema !== 'object') {
                    throw new Error(`Invalid form entry: ${JSON.stringify(form)}`);
                }
                if (form.id !== undefined) {
                    const exists = await database.dataforms.get(form.id);
                    if (exists) {
                        await database.dataforms.put(form);
                        updated++;
                    } else {
                        await database.dataforms.add(form);
                        added++;
                    }
                } else {
                    await database.dataforms.add(form);
                    added++;
                }
            }

            await loadForms();
            setImportState('success');
            setImportMessage(`Imported ${added} new, updated ${updated} existing form${added + updated !== 1 ? 's' : ''}.`);
        } catch (err) {
            setImportState('error');
            setImportMessage(err instanceof Error ? err.message : 'Unknown error during import.');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const dismissMessage = () => {
        setImportState('idle');
        setImportMessage('');
    };

    return (
        <div className="collapse collapse-arrow bg-base-100 border-1 border-base-300 text-sm">
            <input type="radio" name="settings" />
            <h3 className="collapse-title font-semibold">Data Forms</h3>
            <div className="collapse-content text-xs flex flex-col gap-3">

                {/* Summary */}
                <p className="text-base-content/60">
                    {forms.length === 0
                        ? 'No data forms saved.'
                        : `${forms.length} data form${forms.length !== 1 ? 's' : ''} saved.`}
                </p>

                {/* Saved form list */}
                {forms.length > 0 && (
                    <ul className="list-none flex flex-col gap-0.5">
                        {forms.map(form => (
                            <li key={form.id} className="flex items-center justify-between gap-2 py-0.5">
                                <span className="truncate">{form.name}</span>
                                <span className="text-base-content/40 shrink-0">id: {form.id}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Import/export actions */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        className="btn btn-xs btn-outline gap-1"
                        onClick={handleExport}
                        disabled={forms.length === 0}
                        title="Export all data forms as JSON"
                    >
                        <FaDownload size={11} aria-hidden="true" />
                        Export
                    </button>

                    <label className="btn btn-xs btn-outline gap-1 cursor-pointer" title="Import data forms from JSON">
                        <FaUpload size={11} aria-hidden="true" />
                        Import
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={handleImport}
                        />
                    </label>
                </div>

                {/* Feedback */}
                {importState !== 'idle' && (
                    <div className={`alert alert-xs gap-1 py-1.5 ${importState === 'success' ? 'alert-success' : 'alert-error'}`}>
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


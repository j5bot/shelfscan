import { database } from '@/app/lib/database/database';
import { decodeBackupBuffer, encodeBackupPng } from '@/app/lib/utils/backupCodec';
import { formatBytes } from '@/app/lib/utils/size';
import type { DbBackupWorkerRequest, DbBackupWorkerResponse } from '@/app/lib/workers/dbBackupWorker';
import type { DexieExportJsonMeta } from 'dexie-export-import';

// dexie-export-import's bundle runs top-level browser/worker-environment detection (references
// the bare `self` global outside any typeof guard) the moment it's evaluated, which throws
// "self is not defined" under Next.js's Node-based SSR/static prerendering. A dynamic import,
// memoized and only ever awaited from inside functions that run in response to user action,
// keeps that module load entirely client-side. This also augments `Dexie.prototype` with
// `.export()`/`.import()` as a side effect, so every call site below awaits this first.
let dexieExportImportModule: Promise<typeof import('dexie-export-import')> | undefined;
const loadDexieExportImport = (): Promise<typeof import('dexie-export-import')> => {
    dexieExportImportModule ??= import('dexie-export-import');
    return dexieExportImportModule;
};

export type BackupTableName =
    | 'settings'
    | 'plugins'
    | 'collections'
    | 'dataforms'
    | 'scanHistory'
    | 'filters';

export const INCLUDED_TABLES: BackupTableName[] = [
    'settings', 'plugins', 'collections', 'dataforms', 'scanHistory', 'filters',
];

export const TABLE_LABELS: Record<BackupTableName, string> = {
    settings: 'Settings',
    plugins: 'Plugins',
    collections: 'Collections',
    dataforms: 'Data Forms',
    scanHistory: 'Scan History',
    filters: 'Filters',
};

export type BackupImportSummary = {
    tables: { name: string; rowCount: number }[];
};

const BLOCK_KEY = 'shelfscan-backup-data';
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 120;

// PNG encode/decode (png-compressor + deflate) is synchronous CPU work that can run long enough
// on large backups to jank the UI thread, so it's offloaded to a worker. `new URL(..., import
// .meta.url)` is a special bundler-recognized form (Next.js/webpack/Turbopack and Vite all
// special-case it to locate and bundle the worker file) — it must stay a literal relative path,
// not the usual `@/` alias, since it's resolved at build time against this file's own location,
// not through normal module resolution.
type PendingWorkerRequest = {
    resolve: (response: DbBackupWorkerResponse) => void;
    reject: (error: Error) => void;
};

let backupWorker: Worker | undefined;
let requestCounter = 0;
const pendingWorkerRequests = new Map<string, PendingWorkerRequest>();

const nextRequestId = (): string => `${Date.now()}-${++requestCounter}`;

const getBackupWorker = (): Worker | undefined => {
    if (typeof Worker === 'undefined') {
        return undefined;
    }
    if (!backupWorker) {
        backupWorker = new Worker(new URL('../workers/dbBackupWorker.ts', import.meta.url), { type: 'module' });
        backupWorker.onmessage = (event: MessageEvent<DbBackupWorkerResponse>) => {
            const pending = pendingWorkerRequests.get(event.data.requestId);
            if (!pending) {
                return;
            }
            pendingWorkerRequests.delete(event.data.requestId);
            pending.resolve(event.data);
        };
        backupWorker.onerror = (event: ErrorEvent) => {
            for (const [requestId, pending] of pendingWorkerRequests) {
                pending.reject(new Error(event.message || 'Backup worker crashed.'));
                pendingWorkerRequests.delete(requestId);
            }
        };
    }
    return backupWorker;
};

const sendToBackupWorker = (
    worker: Worker,
    request: DbBackupWorkerRequest,
    transfer: Transferable[],
): Promise<DbBackupWorkerResponse> =>
    new Promise((resolve, reject) => {
        pendingWorkerRequests.set(request.requestId, { resolve, reject });
        worker.postMessage(request, transfer);
    });

const encodeBackupPngOffThread = async (pngBytes: Uint8Array, dataBuffer: ArrayBuffer): Promise<Uint8Array> => {
    const worker = getBackupWorker();
    if (!worker) {
        return encodeBackupPng(pngBytes, dataBuffer, BLOCK_KEY);
    }

    const response = await sendToBackupWorker(
        worker,
        { type: 'encode', requestId: nextRequestId(), blockKey: BLOCK_KEY, pngBytes, dataBuffer },
        [pngBytes.buffer, dataBuffer],
    );
    if (!response.ok) {
        throw new Error(response.error);
    }
    if (response.type !== 'encode') {
        throw new Error('Unexpected backup worker response.');
    }
    return response.pngBytes;
};

const decodeBackupBufferOffThread = async (fileBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
    const worker = getBackupWorker();
    if (!worker) {
        return decodeBackupBuffer(fileBuffer, BLOCK_KEY);
    }

    const response = await sendToBackupWorker(
        worker,
        { type: 'decode', requestId: nextRequestId(), blockKey: BLOCK_KEY, fileBuffer },
        [fileBuffer],
    );
    if (!response.ok) {
        throw new Error(response.error);
    }
    if (response.type !== 'decode') {
        throw new Error('Unexpected backup worker response.');
    }
    return response.dataBuffer;
};

const shareOrDownload = async (blob: Blob, filename: string, shareTitle: string): Promise<void> => {
    if (navigator.canShare && typeof navigator.canShare === 'function') {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: shareTitle });
                return;
            } catch (error) {
                console.error('[dbBackup] Web Share failed, falling back to download:', error);
            }
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const createLabelPng = (title: string, subtitle: string, tableSummary: string): Promise<Uint8Array> =>
    new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Canvas 2D context unavailable'));
            return;
        }

        ctx.fillStyle = '#e07ca4';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 6);

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText(tableSummary, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 16, CANVAS_WIDTH - 40);

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('shelfscan.io', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 38);

        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
            }
            blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
        }, 'image/png');
    });

const backupTitle = (tables: BackupTableName[]): string =>
    tables.length === INCLUDED_TABLES.length
        ? 'ShelfScan Backup'
        : `ShelfScan ${tables.map(t => TABLE_LABELS[t]).join(' & ')} Backup`;

export const exportTablesToBlob = async (tables: BackupTableName[] = INCLUDED_TABLES): Promise<Blob> => {
    await loadDexieExportImport();
    return database.export({
        skipTables: database.tables
            .map(t => t.name)
            .filter(name => !tables.includes(name as BackupTableName)),
    });
};

export const createBackupEnvelope = async (blob: Blob, title: string): Promise<Blob> => {
    const { peakImportFile } = await loadDexieExportImport();
    const meta = await peakImportFile(blob);
    const totalRows = meta.data.tables.reduce((sum, t) => sum + t.rowCount, 0);
    const subtitle = `${new Date().toLocaleDateString()} · ${formatBytes(blob.size)} · ${totalRows} row${totalRows !== 1 ? 's' : ''}`;
    const tableSummary = meta.data.tables.map(t => `${t.name} (${t.rowCount})`).join(', ');

    const pngBytes = await createLabelPng(title, subtitle, tableSummary);
    const encoded = await encodeBackupPngOffThread(pngBytes, await blob.arrayBuffer());
    return new Blob([new Uint8Array(encoded)], { type: 'image/png' });
};

export const readBackupBlob = async (file: File): Promise<Blob> => {
    const dataBuffer = await decodeBackupBufferOffThread(await file.arrayBuffer());
    return new Blob([dataBuffer], { type: 'application/json' });
};

export const previewBackupBlob = async (blob: Blob): Promise<DexieExportJsonMeta> => {
    const { peakImportFile } = await loadDexieExportImport();
    return peakImportFile(blob);
};

export const importTablesFromBlob = async (
    blob: Blob,
    tables: BackupTableName[] = INCLUDED_TABLES,
): Promise<BackupImportSummary> => {
    const { peakImportFile } = await loadDexieExportImport();
    const meta = await peakImportFile(blob);

    // clearTablesBeforeImport clears every local table not named in skipTables — including
    // ones absent from the blob entirely (e.g. `scanned`) — so this must be computed from the
    // full local table list, not from meta.data.tables.
    const skipTables = database.tables
        .map(t => t.name)
        .filter(name => !tables.includes(name as BackupTableName));

    await database.import(blob, {
        acceptMissingTables: true,
        acceptVersionDiff: true,
        acceptChangedPrimaryKey: true,
        overwriteValues: true,
        clearTablesBeforeImport: true,
        skipTables,
    });

    return {
        tables: meta.data.tables
            .filter(t => tables.includes(t.name as BackupTableName))
            .map(t => ({ name: t.name, rowCount: t.rowCount })),
    };
};

export const exportBackup = async (tables: BackupTableName[] = INCLUDED_TABLES): Promise<void> => {
    const blob = await exportTablesToBlob(tables);
    const title = backupTitle(tables);
    const png = await createBackupEnvelope(blob, title);
    const filename = `shelfscan-backup-${new Date().toISOString().slice(0, 10)}.png`;
    await shareOrDownload(png, filename, title);
};

export const previewBackupFile = async (file: File): Promise<DexieExportJsonMeta> => {
    const blob = await readBackupBlob(file);
    return previewBackupBlob(blob);
};

export const importBackupFile = async (
    file: File,
    tables: BackupTableName[] = INCLUDED_TABLES,
): Promise<BackupImportSummary> => {
    const blob = await readBackupBlob(file);
    return importTablesFromBlob(blob, tables);
};

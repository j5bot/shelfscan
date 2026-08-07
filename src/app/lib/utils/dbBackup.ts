import { database } from '@/app/lib/database/database';
import { formatBytes } from '@/app/lib/utils/size';
import { peakImportFile, type DexieExportJsonMeta } from 'dexie-export-import';
import {
    decodeImageDataBlocks,
    encodeImageDataBlocks,
    getDataBlock,
} from 'png-compressor';

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

export const exportTablesToBlob = (tables: BackupTableName[] = INCLUDED_TABLES): Promise<Blob> =>
    database.export({
        skipTables: database.tables
            .map(t => t.name)
            .filter(name => !tables.includes(name as BackupTableName)),
    });

export const createBackupEnvelope = async (blob: Blob, title: string): Promise<Blob> => {
    const meta = await peakImportFile(blob);
    const totalRows = meta.data.tables.reduce((sum, t) => sum + t.rowCount, 0);
    const subtitle = `${new Date().toLocaleDateString()} · ${formatBytes(blob.size)} · ${totalRows} row${totalRows !== 1 ? 's' : ''}`;
    const tableSummary = meta.data.tables.map(t => `${t.name} (${t.rowCount})`).join(', ');

    const pngBytes = await createLabelPng(title, subtitle, tableSummary);
    const encoded = await encodeImageDataBlocks(pngBytes, { [BLOCK_KEY]: await blob.arrayBuffer() });
    return new Blob([new Uint8Array(encoded).buffer], { type: 'image/png' });
};

export const readBackupBlob = async (file: File): Promise<Blob> => {
    const buffer = await file.arrayBuffer();
    let dataBlocks: Awaited<ReturnType<typeof decodeImageDataBlocks>>['blocks'];
    try {
        const result = await decodeImageDataBlocks(new Uint8Array(buffer));
        dataBlocks = result.blocks;
    } catch {
        throw new Error('File is not a valid PNG or could not be read.');
    }

    const bytes = getDataBlock(BLOCK_KEY, dataBlocks) as Uint8Array | undefined;
    if (!bytes) {
        throw new Error('This PNG does not contain a ShelfScan backup.');
    }

    return new Blob([new Uint8Array(bytes).buffer], { type: 'application/json' });
};

export const previewBackupBlob = (blob: Blob): Promise<DexieExportJsonMeta> =>
    peakImportFile(blob);

export const importTablesFromBlob = async (
    blob: Blob,
    tables: BackupTableName[] = INCLUDED_TABLES,
): Promise<BackupImportSummary> => {
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

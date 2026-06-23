'use client';

import { ScanHistoryEntry } from '@/app/lib/types/scanHistory';
import {
    decodeImageDataBlocks,
    encodeImageDataBlocks,
    getDataBlock,
} from 'png-compressor';

const FILENAME = 'shelfscan-scan-history.png';

const shareOrDownload = async (blob: Blob): Promise<void> => {
    if (navigator.canShare && typeof navigator.canShare === 'function') {
        const file = new File([blob], FILENAME, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'ShelfScan History' });
                return;
            } catch (error) {
                console.error('[scanHistoryImage] Web Share failed, falling back to download:', error);
            }
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FILENAME;
    a.click();
    URL.revokeObjectURL(url);
};

const BLOCK_KEY = 'shelfscan-history';
const EXPORT_VERSION = 1;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 80;
const LABEL = 'ShelfScan Scan History Data File';

type ExportPayload = {
    version: number;
    exportedAt: number;
    entries: Omit<ScanHistoryEntry, 'id'>[];
};

const createLabelPng = (): Promise<Uint8Array> =>
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
        ctx.fillText(LABEL, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('shelfscan.io', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 16);

        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
            }
            blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
        }, 'image/png');
    });

export const exportScanHistory = async (entries: ScanHistoryEntry[]): Promise<void> => {
    const stripped = entries.map(({ id: _, ...rest }) => rest);
    const payload: ExportPayload = {
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        entries: stripped,
    };

    const pngBytes = await createLabelPng();
    const encoded = await encodeImageDataBlocks(pngBytes, { [BLOCK_KEY]: payload });
    const blob = new Blob([new Uint8Array(encoded).buffer], { type: 'image/png' });
    await shareOrDownload(blob);
};

export const importScanHistory = async (file: File): Promise<Omit<ScanHistoryEntry, 'id'>[]> => {
    const buffer = await file.arrayBuffer();
    let dataBlocks: Awaited<ReturnType<typeof decodeImageDataBlocks>>['blocks'];
    try {
        const result = await decodeImageDataBlocks(new Uint8Array(buffer));
        dataBlocks = result.blocks;
    } catch {
        throw new Error('File is not a valid PNG or could not be read.');
    }

    const payload = getDataBlock(BLOCK_KEY, dataBlocks) as ExportPayload | undefined;
    if (!payload || !Array.isArray(payload.entries)) {
        throw new Error('This PNG does not contain ShelfScan scan history data.');
    }

    return payload.entries as Omit<ScanHistoryEntry, 'id'>[];
};

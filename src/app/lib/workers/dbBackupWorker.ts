/// <reference lib="webworker" />

import { decodeBackupBuffer, encodeBackupPng } from '@/app/lib/utils/backupCodec';

export type DbBackupWorkerRequest =
    | { type: 'encode'; requestId: string; blockKey: string; pngBytes: Uint8Array; dataBuffer: ArrayBuffer }
    | { type: 'decode'; requestId: string; blockKey: string; fileBuffer: ArrayBuffer };

export type DbBackupWorkerResponse =
    | { type: 'encode'; requestId: string; ok: true; pngBytes: Uint8Array }
    | { type: 'decode'; requestId: string; ok: true; dataBuffer: ArrayBuffer }
    | { type: 'encode' | 'decode'; requestId: string; ok: false; error: string };

const post = (response: DbBackupWorkerResponse, transfer: Transferable[] = []) => {
    (self as unknown as Worker).postMessage(response, transfer);
};

self.onmessage = async (event: MessageEvent<DbBackupWorkerRequest>) => {
    const message = event.data;

    try {
        if (message.type === 'encode') {
            const pngBytes = await encodeBackupPng(message.pngBytes, message.dataBuffer, message.blockKey);
            post({ type: 'encode', requestId: message.requestId, ok: true, pngBytes }, [pngBytes.buffer]);
            return;
        }

        const dataBuffer = await decodeBackupBuffer(message.fileBuffer, message.blockKey);
        post({ type: 'decode', requestId: message.requestId, ok: true, dataBuffer }, [dataBuffer]);
    } catch (err) {
        post({
            type: message.type,
            requestId: message.requestId,
            ok: false,
            error: err instanceof Error ? err.message : 'Unknown backup worker error',
        });
    }
};

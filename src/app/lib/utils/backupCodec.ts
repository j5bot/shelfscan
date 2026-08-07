import {
    decodeImageDataBlocks,
    encodeImageDataBlocks,
    getDataBlocks,
} from 'png-compressor';

// png-compressor encodes each binary block via String.fromCharCode.apply(null, ...) — a single
// block larger than the JS engine's argument-spread limit (~65k) throws "Maximum call stack size
// exceeded". Splitting the backup into chunks under the same block key (png-compressor natively
// supports multiple blocks per key) keeps every individual apply() call well within that limit.
export const CHUNK_SIZE_BYTES = 32 * 1024;

export const chunkArrayBuffer = (buffer: ArrayBuffer, chunkSize: number): ArrayBuffer[] => {
    const bytes = new Uint8Array(buffer);
    const chunks: ArrayBuffer[] = [];
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        chunks.push(bytes.slice(offset, offset + chunkSize).buffer);
    }
    return chunks;
};

// Pure, DOM/worker-agnostic codec functions. This is the actual PNG-encoding CPU work — it's
// shared between the dbBackup web worker (the normal path in a browser) and a same-thread
// fallback for contexts without Worker support (tests, SSR-safety), so both paths run identical
// logic and throw identical errors.

export const encodeBackupPng = async (
    pngBytes: Uint8Array,
    dataBuffer: ArrayBuffer,
    blockKey: string,
): Promise<Uint8Array> => {
    const chunks = chunkArrayBuffer(dataBuffer, CHUNK_SIZE_BYTES);
    const encoded = await encodeImageDataBlocks(pngBytes, { [blockKey]: chunks });
    return new Uint8Array(encoded);
};

export const decodeBackupBuffer = async (fileBuffer: ArrayBuffer, blockKey: string): Promise<ArrayBuffer> => {
    let blocks: Awaited<ReturnType<typeof decodeImageDataBlocks>>['blocks'];
    try {
        const result = await decodeImageDataBlocks(new Uint8Array(fileBuffer));
        blocks = result.blocks;
    } catch {
        throw new Error('File is not a valid PNG or could not be read.');
    }

    const chunks = getDataBlocks(blockKey, blocks) as Uint8Array[];
    if (chunks.length === 0) {
        throw new Error('This PNG does not contain a ShelfScan backup.');
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return combined.buffer;
};

import { describe, it, expect, beforeEach, afterEach, vi } from '../setup';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { exportScanHistory, importScanHistory } from '@/app/lib/utils/scanHistoryImage';
import { ScanHistoryEntry, ScanHistoryMatchStatus, SCAN_HISTORY_SCHEMA_VERSION } from '@/app/lib/types/scanHistory';

// Minimal valid 1x1 transparent PNG
const MINIMAL_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const MOCK_ENTRIES: ScanHistoryEntry[] = [
    {
        id: 1,
        upc: '1234567890123',
        timestamp: 1700000000,
        updatedAt: 1700000001,
        status: ScanHistoryMatchStatus.matched,
        verified: true,
        schemaVersion: SCAN_HISTORY_SCHEMA_VERSION,
        gameName: 'Catan',
        bggId: 13,
        username: 'testuser',
    },
    {
        id: 2,
        upc: '9876543210987',
        timestamp: 1700000100,
        updatedAt: 1700000101,
        status: ScanHistoryMatchStatus.unmatched,
        verified: false,
        schemaVersion: SCAN_HISTORY_SCHEMA_VERSION,
    },
];

describe('scanHistoryImage', () => {
    let capturedBlob: Blob | undefined;
    const minimalPngBytes = Buffer.from(MINIMAL_PNG_B64, 'base64');

    const setupCanvasMock = () => {
        const mockCtx = {
            fillStyle: '' as string,
            textAlign: '' as CanvasTextAlign,
            textBaseline: '' as CanvasTextBaseline,
            font: '',
            fillRect: vi.fn(),
            fillText: vi.fn(),
        };

        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            mockCtx as unknown as CanvasRenderingContext2D,
        );

        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
            (callback: BlobCallback) => {
                callback(new Blob([minimalPngBytes], { type: 'image/png' }));
            },
        );
    };

    const setupDownloadMocks = () => {
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        vi.spyOn(URL, 'createObjectURL').mockImplementation((obj) => {
            capturedBlob = obj as Blob;
            return 'blob:mock-url';
        });

        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    };

    beforeEach(() => {
        capturedBlob = undefined;
        // Default: no Web Share API
        vi.stubGlobal('navigator', { canShare: undefined, share: undefined });
        setupCanvasMock();
        setupDownloadMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('round-trip', () => {
        it('export then import recovers the original entries (minus ids)', async () => {
            await exportScanHistory(MOCK_ENTRIES);
            expect(capturedBlob).toBeDefined();

            const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
            writeFileSync(join(import.meta.dirname, 'shelfscan-scan-history.png'), bytes);

            const file = new File([capturedBlob!], 'shelfscan-scan-history.png', { type: 'image/png' });
            const imported = await importScanHistory(file);

            const expected = MOCK_ENTRIES.map(({ id: _, ...rest }) => rest);
            expect(imported).toEqual(expected);
        });

        it('strips ids from exported entries', async () => {
            await exportScanHistory(MOCK_ENTRIES);
            const file = new File([capturedBlob!], 'export.png', { type: 'image/png' });
            const imported = await importScanHistory(file);

            for (const entry of imported) {
                expect(entry).not.toHaveProperty('id');
            }
        });
    });

    describe('download fallback (no Web Share API)', () => {
        it('triggers an anchor-based download', async () => {
            await exportScanHistory(MOCK_ENTRIES);

            expect(URL.createObjectURL).toHaveBeenCalledOnce();
            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
        });
    });

    describe('Web Share API', () => {
        it('uses navigator.share when canShare returns true', async () => {
            const shareMock = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('navigator', {
                canShare: vi.fn().mockReturnValue(true),
                share: shareMock,
            });

            await exportScanHistory(MOCK_ENTRIES);

            expect(shareMock).toHaveBeenCalledOnce();
            expect(shareMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'ShelfScan History',
                    files: expect.arrayContaining([expect.any(File)]),
                }),
            );
            // anchor fallback should NOT have fired
            expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
        });

        it('falls back to download when canShare returns false', async () => {
            vi.stubGlobal('navigator', {
                canShare: vi.fn().mockReturnValue(false),
                share: vi.fn(),
            });

            await exportScanHistory(MOCK_ENTRIES);

            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
        });

        it('falls back to download when navigator.share rejects', async () => {
            vi.stubGlobal('navigator', {
                canShare: vi.fn().mockReturnValue(true),
                share: vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError')),
            });

            await exportScanHistory(MOCK_ENTRIES);

            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
        });
    });

    describe('import errors', () => {
        it('throws when importing a PNG without history data', async () => {
            const file = new File([minimalPngBytes], 'other.png', { type: 'image/png' });
            await expect(importScanHistory(file)).rejects.toThrow(
                'This PNG does not contain ShelfScan scan history data.',
            );
        });

        it('throws when importing a non-PNG file', async () => {
            const file = new File(['not a png at all'], 'data.txt', { type: 'text/plain' });
            await expect(importScanHistory(file)).rejects.toThrow(
                'File is not a valid PNG or could not be read.',
            );
        });
    });
});

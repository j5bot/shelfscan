import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from '../setup';
import { database } from '@/app/lib/database/database';
import {
    exportBackup,
    importBackupFile,
    previewBackupFile,
    readBackupBlob,
    INCLUDED_TABLES,
} from '@/app/lib/utils/dbBackup';
import { ScanHistoryMatchStatus, SCAN_HISTORY_SCHEMA_VERSION } from '@/app/lib/types/scanHistory';

// Minimal valid 1x1 transparent PNG (no ShelfScan data blocks)
const MINIMAL_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('dbBackup', () => {
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

    const exportAndCapture = async (tables?: (typeof INCLUDED_TABLES)): Promise<File> => {
        await exportBackup(tables);
        expect(capturedBlob).toBeDefined();
        return new File([capturedBlob!], 'shelfscan-backup.png', { type: 'image/png' });
    };

    beforeEach(async () => {
        capturedBlob = undefined;
        vi.stubGlobal('navigator', { canShare: undefined, share: undefined });
        setupCanvasMock();
        setupDownloadMocks();

        await Promise.all([
            database.settings.clear(),
            database.plugins.clear(),
            database.collections.clear(),
            database.dataforms.clear(),
            database.scanHistory.clear(),
            database.filters.clear(),
            database.scanned.clear(),
        ]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('round trip', () => {
        it('exports and restores every included table', async () => {
            await database.settings.add({ id: 'theme', value: 'dark' });
            await database.filters.add({ name: 'My Filter', filters: { category: 'strategy' } });
            await database.scanHistory.add({
                upc: '1234567890123',
                timestamp: 1700000000,
                updatedAt: 1700000000,
                status: ScanHistoryMatchStatus.matched,
                verified: true,
                schemaVersion: SCAN_HISTORY_SCHEMA_VERSION,
                gameName: 'Catan',
            });

            const file = await exportAndCapture();

            // Mutate local state to prove import actually restores it
            await database.settings.clear();
            await database.filters.clear();
            await database.scanHistory.clear();

            const summary = await importBackupFile(file);

            expect(await database.settings.get('theme')).toEqual({ id: 'theme', value: 'dark' });
            expect(await database.filters.toArray()).toMatchObject([
                { name: 'My Filter', filters: { category: 'strategy' } },
            ]);
            expect(await database.scanHistory.toArray()).toMatchObject([
                { upc: '1234567890123', gameName: 'Catan' },
            ]);
            expect(summary.tables.map(t => t.name).sort()).toEqual([...INCLUDED_TABLES].sort());
        });
    });

    describe('scoping', () => {
        it('never includes or touches the scanned table', async () => {
            await database.scanned.add({ id: 'session-1', codes: ['abc123'] });
            await database.settings.add({ id: 'theme', value: 'dark' });

            const file = await exportAndCapture();

            const preview = await previewBackupFile(file);
            expect(preview.data.tables.map(t => t.name)).not.toContain('scanned');

            await database.settings.clear();
            await importBackupFile(file);

            expect(await database.scanned.get('session-1')).toEqual({ id: 'session-1', codes: ['abc123'] });
        });

        it('scopes import to only the requested tables even when the file has more', async () => {
            await database.settings.add({ id: 'theme', value: 'dark' });
            await database.filters.add({ name: 'My Filter', filters: {} });

            const file = await exportAndCapture(); // full backup: settings + filters + others

            await database.settings.clear();
            await database.filters.clear();

            const summary = await importBackupFile(file, ['settings']);

            expect(summary.tables.map(t => t.name)).toEqual(['settings']);
            expect(await database.settings.toArray()).toHaveLength(1);
            expect(await database.filters.toArray()).toHaveLength(0);
        });
    });

    describe('previewBackupFile', () => {
        it('reports table names and row counts without writing anything', async () => {
            await database.settings.add({ id: 'a', value: 1 });
            await database.settings.add({ id: 'b', value: 2 });

            const file = await exportAndCapture();
            await database.settings.clear();

            const preview = await previewBackupFile(file);
            const settingsEntry = preview.data.tables.find(t => t.name === 'settings');

            expect(settingsEntry?.rowCount).toBe(2);
            expect(await database.settings.count()).toBe(0);
        });
    });

    describe('error paths', () => {
        it('throws when the file is not a valid PNG', async () => {
            const file = new File(['not a png at all'], 'data.txt', { type: 'text/plain' });
            await expect(readBackupBlob(file)).rejects.toThrow(
                'File is not a valid PNG or could not be read.',
            );
        });

        it('throws when the PNG has no ShelfScan backup data block', async () => {
            const file = new File([minimalPngBytes], 'other.png', { type: 'image/png' });
            await expect(readBackupBlob(file)).rejects.toThrow(
                'This PNG does not contain a ShelfScan backup.',
            );
        });
    });
});

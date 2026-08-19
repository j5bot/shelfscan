import { describe, it, expect } from '../setup.js';
import { vi } from 'vitest';
import JSZip from 'jszip';
import { makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import {
    buildSwapExportOds,
    downloadSwapExport,
    getSwapItemImageCacheKey,
} from '@/app/lib/utils/swapExport';
import { getPageDOM } from '@/app/lib/utils/xml';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import type { BggCollectionItem, BggCollectionStatuses } from '@/app/lib/types/bgg';

const { getImageDataFromCacheMock } = vi.hoisted(() => ({
    getImageDataFromCacheMock: vi.fn(),
}));

vi.mock('@/app/lib/database/cacheDatabase', async importOriginal => {
    const actual = await importOriginal<typeof import('@/app/lib/database/cacheDatabase')>();
    return { ...actual, getImageDataFromCache: getImageDataFromCacheMock };
});

const ODS_MIME_TYPE = 'application/vnd.oasis.opendocument.spreadsheet';

const defaultStatuses: BggCollectionStatuses = {
    own: true,
    prevowned: false,
    fortrade: false,
    want: false,
    wanttoplay: false,
    wanttobuy: false,
    wishlist: false,
    preordered: false,
};

const makeCollectionItem = (overrides: Partial<BggCollectionItem> = {}): BggCollectionItem => ({
    objectId: 1,
    collectionId: 1,
    name: 'Catan',
    yearPublished: 2020,
    subType: 'boardgame',
    statuses: { ...defaultStatuses },
    rating: 0,
    lastModified: '',
    image: undefined,
    thumbnail: undefined,
    ...overrides,
});

const getContentXml = async (blob: Blob): Promise<string> => {
    const zip = await JSZip.loadAsync(blob);
    const file = zip.file('content.xml');
    if (!file) { throw new Error('content.xml missing from ODS package'); }
    return file.async('string');
};

const getRows = (contentXml: string) => {
    const doc = getPageDOM(contentXml, true);
    return Array.from(doc.getElementsByTagName('table:table-row'));
};

const cellTexts = (row: Element) =>
    Array.from(row.getElementsByTagName('table:table-cell')).map(cell => cell.textContent ?? '');

describe('swapExport', () => {
    describe('#buildSwapExportOds', () => {
        it('produces an ODS blob with a styled header row and the expected columns', async () => {
            const blob = await buildSwapExportOds([]);
            expect(blob.type).toBe(ODS_MIME_TYPE);

            const zip = await JSZip.loadAsync(blob);
            expect(await zip.file('mimetype')?.async('string')).toBe(ODS_MIME_TYPE);
            expect(zip.file('META-INF/manifest.xml')).not.toBeNull();

            const contentXml = await getContentXml(blob);
            const rows = getRows(contentXml);
            expect(rows).toHaveLength(1);
            expect(cellTexts(rows[0])).toEqual([
                'Item Id', 'Name', 'Description', 'Comparative Value', 'Sell For', 'Image',
            ]);

            const headerCells = Array.from(rows[0].getElementsByTagName('table:table-cell'));
            headerCells.forEach(cell => {
                expect(cell.getAttribute('table:style-name')).toBe('coHeader');
            });
        });

        it('writes item fields into their columns, leaving unset values blank', async () => {
            const items: SwapItemData[] = [
                {
                    collectionId: 1,
                    swapItemId: 42,
                    name: 'Catan',
                    description: 'Great condition\nBox has wear',
                    compareValue: 5,
                    cashValue: 10,
                },
                {
                    collectionId: 2,
                    name: 'Wingspan',
                    description: 'Sleeved',
                },
            ];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(rows).toHaveLength(3);

            expect(cellTexts(rows[1])).toEqual([
                '42', 'Catan', 'Great conditionBox has wear', '5', '10', '',
            ]);
            const descriptionParagraphs = Array.from(
                rows[1].getElementsByTagName('table:table-cell')[2].getElementsByTagName('text:p')
            ).map(p => p.textContent);
            expect(descriptionParagraphs).toEqual(['Great condition', 'Box has wear']);
            expect(cellTexts(rows[2])).toEqual([
                '', 'Wingspan', 'Sleeved', '', '', '',
            ]);
        });

        it('clamps comparative value to 0-10 and sell for to a minimum of 0', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                compareValue: 20,
                cashValue: -3,
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[1])[3]).toBe('10');
            expect(cellTexts(rows[1])[4]).toBe('0');
        });

        it('escapes XML-significant characters in text fields', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'A & B <Game> "Special"',
                description: `It's a trade & it's <great>`,
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            const cells = cellTexts(rows[1]);
            expect(cells[1]).toBe('A & B <Game> "Special"');
            expect(cells[2]).toBe(`It's a trade & it's <great>`);
        });

        it('embeds a cached image and references it from the Pictures folder', async () => {
            const imageBytes = new Uint8Array([1, 2, 3, 4]);
            getImageDataFromCacheMock.mockResolvedValueOnce(
                new Blob([imageBytes], { type: 'image/jpeg' })
            );

            const bitmapCloseMock = vi.fn();
            vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
                width: 800,
                height: 400,
                close: bitmapCloseMock,
            }));

            try {
                const items: SwapItemData[] = [{
                    collectionId: 1,
                    name: 'Catan',
                    description: '',
                    imageKey: 'game-pic.jpg|400|400|90',
                }];

                const blob = await buildSwapExportOds(items);
                const zip = await JSZip.loadAsync(blob);

                expect(zip.file('Pictures/image0.jpg')).not.toBeNull();

                const manifestXml = await zip.file('META-INF/manifest.xml')?.async('string');
                expect(manifestXml).toContain('manifest:full-path="Pictures/image0.jpg"');
                expect(manifestXml).toContain('manifest:media-type="image/jpeg"');

                const contentXml = await getContentXml(blob);
                expect(contentXml).toContain('xlink:href="Pictures/image0.jpg"');
                // Aspect ratio (2:1) preserved and bounded within the 1.5in image cell.
                const frameMatch = /svg:width="([\d.]+)in" svg:height="([\d.]+)in"/.exec(contentXml);
                expect(frameMatch).not.toBeNull();
                const [, width, height] = frameMatch!;
                expect(Number(width)).toBeLessThanOrEqual(1.5);
                expect(Number(height)).toBeLessThanOrEqual(1.5);
                expect(Number(width) / Number(height)).toBeCloseTo(2, 1);
                expect(bitmapCloseMock).toHaveBeenCalled();
            } finally {
                vi.unstubAllGlobals();
            }
        });

        it('leaves the image cell blank when the imageKey is not present in the cache', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                imageKey: 'not-cached.jpg|400|400|90',
            }];

            const blob = await buildSwapExportOds(items);
            const zip = await JSZip.loadAsync(blob);
            expect(Object.keys(zip.files).some(name => name.startsWith('Pictures/'))).toBe(false);
        });
    });

    describe('#downloadSwapExport', () => {
        it('triggers a download of the generated ODS blob', async () => {
            vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
            const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            await downloadSwapExport([{ collectionId: 1, name: 'Catan', description: '' }], 'my-export.ods');

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            const [blobArg] = createObjectURLSpy.mock.calls[0];
            expect((blobArg as Blob).type).toBe(ODS_MIME_TYPE);
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

            createObjectURLSpy.mockRestore();
            revokeObjectURLSpy.mockRestore();
            vi.restoreAllMocks();
        });
    });

    describe('#getSwapItemImageCacheKey', () => {
        it('derives the same cache key used by the thumbnail cache for a BGG image URL', () => {
            const item = makeCollectionItem({
                version: {
                    image: 'https://cf.geekdo-images.com/abcd1234-pic1234567.jpg',
                } as BggCollectionItem['version'],
            });

            const key = getSwapItemImageCacheKey(item);
            const expected = makeImageCacheId({
                src: '/bgg-images/abcd1234-pic1234567.jpg',
                width: 400,
                height: 400,
                quality: 90,
            } as Parameters<typeof makeImageCacheId>[0]);

            expect(key).toBe(expected);
        });

        it('falls back to item.image then item.thumbnail when no version image is set', () => {
            const item = makeCollectionItem({
                image: 'https://cf.geekdo-images.com/fallback-pic999.jpg',
            });

            expect(getSwapItemImageCacheKey(item)).toContain('fallback-pic999.jpg');
        });

        it('returns undefined when no image is available', () => {
            const item = makeCollectionItem();
            expect(getSwapItemImageCacheKey(item)).toBeUndefined();
        });
    });
});

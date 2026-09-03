import { describe, it, expect } from '../setup.js';
import { vi } from 'vitest';
import JSZip from 'jszip';
import { makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import {
    buildSwapExportCsv,
    buildSwapExportOds,
    downloadSwapExport,
    downloadSwapExportCsv,
    getSwapItemImageCacheKey,
} from '@/app/lib/utils/swapExport';
import { getPageDOM } from '@/app/lib/utils/xml';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import type { BggCollectionItem, BggCollectionStatuses, BggVersion } from '@/app/lib/types/bgg';

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

const makeVersion = (overrides: Partial<BggVersion> = {}): BggVersion => ({
    id: 686378,
    name: 'English edition',
    image: 'https://cf.geekdo-images.com/version-pic.jpg',
    languages: ['English'],
    productCode: undefined,
    yearPublished: 2023,
    publisher: 'Good Games Publishing',
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
        it('omits every column when there are no items to export', async () => {
            const blob = await buildSwapExportOds([]);
            expect(blob.type).toBe(ODS_MIME_TYPE);

            const contentXml = await getContentXml(blob);
            const rows = getRows(contentXml);
            expect(rows).toHaveLength(1);
            expect(cellTexts(rows[0])).toEqual([]);
        });

        it('only includes columns that have data in at least one row', async () => {
            const items: SwapItemData[] = [
                {
                    collectionId: 1,
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

            // Condition is only parseable from the first row's description, and
            // compareValue/cashValue are only set on the first row, but each column
            // still appears (and is left blank on the second row) once any row has it.
            // Copies always has a value (defaulting to 1), so it is always present.
            expect(cellTexts(rows[0])).toEqual([
                'Name', 'Condition', 'Description', 'Copies', 'Compare Value', 'Cash Value',
            ]);

            const headerCells = Array.from(rows[0].getElementsByTagName('table:table-cell'));
            headerCells.forEach(cell => {
                expect(cell.getAttribute('table:style-name')).toBe('coHeader');
            });

            expect(cellTexts(rows[1])).toEqual(['Catan', 'Very Good', 'Great conditionBox has wear', '1', '5', '10']);
            const descriptionParagraphs = Array.from(
                rows[1].getElementsByTagName('table:table-cell')[2].getElementsByTagName('text:p')
            ).map(p => p.textContent);
            expect(descriptionParagraphs).toEqual(['Great condition', 'Box has wear']);
            expect(cellTexts(rows[2])).toEqual(['Wingspan', '', 'Sleeved', '1', '', '']);
        });

        it('treats an empty string as "no data" for column presence', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            // Copies always has a value (defaulting to 1), so it is always present.
            expect(cellTexts(rows[0])).toEqual(['Name', 'Copies']);
        });

        it('derives type/BGG/version columns from SwapItemData.collectionItem', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Unfair: Comicbook Hacker Kaiju Ocean Expansion',
                description: '',
                collectionItem: makeCollectionItem({
                    subType: 'boardgameexpansion',
                    objectId: 341772,
                    yearPublished: 2023,
                    versionId: 686378,
                    version: makeVersion(),
                }),
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).toEqual([
                'Type', 'Name', 'BGG ID', 'Game Year', 'Copies', 'Version Name', 'Version Year',
                'Version ID', 'Version Language', 'Version Publisher', 'Image URL',
            ]);
            expect(cellTexts(rows[1])).toEqual([
                'boardgameexpansion', 'Unfair: Comicbook Hacker Kaiju Ocean Expansion', '341772', '2023', '1',
                'English edition', '2023', '686378', 'English', 'Good Games Publishing',
                'https://cf.geekdo-images.com/version-pic.jpg',
            ]);
        });

        it('derives the thumbnail URL column from collectionItem.thumbnail, independent of imageUrl', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                collectionItem: makeCollectionItem({
                    thumbnail: 'https://cf.geekdo-images.com/thumb-pic.jpg',
                    versionId: 686378,
                    version: makeVersion(),
                }),
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).toEqual([
                'Type', 'Name', 'BGG ID', 'Game Year', 'Copies', 'Version Name', 'Version Year',
                'Version ID', 'Version Language', 'Version Publisher', 'Image URL', 'Thumbnail URL',
            ]);
            const cells = cellTexts(rows[1]);
            expect(cells[cells.length - 2]).toBe('https://cf.geekdo-images.com/version-pic.jpg');
            expect(cells[cells.length - 1]).toBe('https://cf.geekdo-images.com/thumb-pic.jpg');
        });

        it('omits the Thumbnail URL column when no item has a collectionItem.thumbnail', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                collectionItem: makeCollectionItem({ version: makeVersion() }),
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).not.toContain('Thumbnail URL');
        });

        it('clamps comparative value to 0-10 and cash value to a minimum of 0', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                compareValue: 20,
                cashValue: -3,
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).toEqual(['Name', 'Copies', 'Compare Value', 'Cash Value']);
            expect(cellTexts(rows[1])).toEqual(['Catan', '1', '10', '0']);
        });

        it('exports an explicit condition as-is', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: 'Some wear on the box',
                condition: 'Like New',
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).toEqual(['Name', 'Condition', 'Description', 'Copies']);
            expect(cellTexts(rows[1])).toEqual(['Catan', 'Like New', 'Some wear on the box', '1']);
        });

        it('falls back to parsing condition from the description when none is set explicitly', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: 'Condition: Very Good, minor shelf wear',
            }];

            const contentXml = await getContentXml(await buildSwapExportOds(items));
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).toEqual(['Name', 'Condition', 'Description', 'Copies']);
            expect(cellTexts(rows[1])).toEqual(['Catan', 'Very Good', 'Condition: Very Good, minor shelf wear', '1']);
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
            expect(cells[0]).toBe('A & B <Game> "Special"');
            expect(cells[1]).toBe(`It's a trade & it's <great>`);
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
                const rows = getRows(contentXml);
                expect(cellTexts(rows[0])).toEqual(['Name', 'Copies', 'Image']);
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

        it('omits the Image column entirely when the imageKey is not present in the cache', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                imageKey: 'not-cached.jpg|400|400|90',
            }];

            const blob = await buildSwapExportOds(items);
            const zip = await JSZip.loadAsync(blob);
            expect(Object.keys(zip.files).some(name => name.startsWith('Pictures/'))).toBe(false);

            const contentXml = await getContentXml(blob);
            const rows = getRows(contentXml);
            expect(cellTexts(rows[0])).toEqual(['Name', 'Copies']);
        });
    });

    describe('#buildSwapExportCsv', () => {
        const parseCsv = (csv: string) => csv.split('\r\n').map(line => {
            const fields: string[] = [];
            let field = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (inQuotes) {
                    if (char === '"' && line[i + 1] === '"') { field += '"'; i++; }
                    else if (char === '"') { inQuotes = false; }
                    else { field += char; }
                } else if (char === '"') { inQuotes = true; }
                else if (char === ',') { fields.push(field); field = ''; }
                else { field += char; }
            }
            fields.push(field);
            return fields;
        });

        it('emits only a header row when there are no items', () => {
            expect(buildSwapExportCsv([])).toBe('');
        });

        it('outputs present columns as CSV without the Image column', () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: 'Great condition',
                compareValue: 5,
                cashValue: 10,
                imageKey: 'game-pic.jpg|400|400|90',
            }];

            const lines = parseCsv(buildSwapExportCsv(items));
            expect(lines[0]).toEqual(['Name', 'Condition', 'Description', 'Copies', 'Compare Value', 'Cash Value']);
            expect(lines[0]).not.toContain('Image');
            expect(lines[1]).toEqual(['Catan', 'Very Good', 'Great condition', '1', '5', '10']);
        });

        it('keeps the Image URL / Thumbnail URL columns, which are plain text', async () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'Catan',
                description: '',
                collectionItem: makeCollectionItem({
                    thumbnail: 'https://cf.geekdo-images.com/thumb-pic.jpg',
                    versionId: 686378,
                    version: makeVersion(),
                }),
            }];

            const lines = parseCsv(buildSwapExportCsv(items));
            expect(lines[0]).toContain('Image URL');
            expect(lines[0]).toContain('Thumbnail URL');
            expect(lines[0]).not.toContain('Image');
        });

        it('quotes fields containing commas, quotes, or newlines (RFC 4180)', () => {
            const items: SwapItemData[] = [{
                collectionId: 1,
                name: 'A, B & "C"',
                description: 'line one\nline two',
            }];

            const csv = buildSwapExportCsv(items);
            expect(csv).toContain('"A, B & ""C"""');
            expect(csv).toContain('"line one\nline two"');

            const lines = parseCsv(csv);
            expect(lines[1]).toEqual(['A, B & "C"', 'line one\nline two', '1']);
        });
    });

    describe('#downloadSwapExportCsv', () => {
        it('triggers a download of a text/csv blob', () => {
            vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
            const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            downloadSwapExportCsv([{ collectionId: 1, name: 'Catan', description: '' }], 'my-export.csv');

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
            const [blobArg] = createObjectURLSpy.mock.calls[0];
            expect((blobArg as Blob).type).toBe('text/csv;charset=utf-8');
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

            createObjectURLSpy.mockRestore();
            revokeObjectURLSpy.mockRestore();
            vi.restoreAllMocks();
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

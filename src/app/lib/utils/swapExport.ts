import { getImageDataFromCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { MAX_NORMAL_IMAGE_SIZE, NORMAL_IMAGE_CACHE_QUALITY, rewriteImageSrc } from '@/app/lib/hooks/useCachedImage';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { ResolvedImage, TradeItemInteropFormatColumnHeaders } from '@/app/lib/types/trade';
import { conditionParser } from '@/app/lib/utils/condition';
import { clampCashValue, clampCompareValue } from '@/app/lib/utils/trade';
import JSZip from 'jszip';
import { ImageProps } from 'next/image';

const ODS_MIME_TYPE = 'application/vnd.oasis.opendocument.spreadsheet';
const CSV_MIME_TYPE = 'text/csv;charset=utf-8';

const IMAGE_CELL_WIDTH_IN = 1.5;
const IMAGE_CELL_HEIGHT_IN = 1.5;
const PX_PER_IN = 96;

const EXTENSION_BY_MEDIA_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

type ResolvedRow = {
    item: SwapItemData;
    image?: ResolvedImage;
};

type ColumnValue = string | number | ResolvedImage | undefined;

type CellDefinitionFn = (value: ColumnValue, className?: string) => string;

type ColumnWidth = 'text' | 'number' | 'image';

type ColumnDef = {
    header: string;
    width: ColumnWidth;
    wrap?: boolean;
    getValue: (row: ResolvedRow) => ColumnValue;
    cellFn: CellDefinitionFn;
};

export const getSwapItemImageCacheKey = (item: BggCollectionItem): string | undefined => {
    const rawSrc = item.version?.image ?? item.image ?? item.thumbnail;
    if (!rawSrc) { return undefined; }
    return makeImageCacheId({
        src: rewriteImageSrc(rawSrc),
        width: MAX_NORMAL_IMAGE_SIZE,
        height: MAX_NORMAL_IMAGE_SIZE,
        quality: NORMAL_IMAGE_CACHE_QUALITY,
    } as ImageProps);
};

const escapeXml = (value: string): string => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const textParagraphs = (value: string): string => {
    const lines = value.split(/\r\n|\r|\n/);
    return lines.map(line => `<text:p>${escapeXml(line)}</text:p>`).join('');
};

const numberCell: CellDefinitionFn = value => value === undefined
    ? '<table:table-cell/>'
    : `<table:table-cell office:value-type="float" office:value="${value}"><text:p>${value}</text:p></table:table-cell>`;

const stringCell: CellDefinitionFn = (value, styleName) => {
    if (value === undefined) { return '<table:table-cell/>'; }
    const styleAttr = styleName ? ` table:style-name="${styleName}"` : '';
    return `<table:table-cell${styleAttr} office:value-type="string">${textParagraphs(value as string)}</table:table-cell>`;
};

const imageCell: CellDefinitionFn = value => {
    const image = value as ResolvedImage | undefined;
    if (!image) { return '<table:table-cell/>'; }
    return `<table:table-cell>`
        + `<draw:frame svg:width="${image.widthIn.toFixed(3)}in" svg:height="${image.heightIn.toFixed(3)}in" `
        + `svg:x="0in" svg:y="0in" draw:z-index="0">`
        + `<draw:image xlink:href="${image.path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>`
        + `</draw:frame>`
        + `</table:table-cell>`;
};

const fitWithinInches = (width: number, height: number): { widthIn: number; heightIn: number } => {
    const widthIn = width / PX_PER_IN;
    const heightIn = height / PX_PER_IN;
    const scale = Math.min(IMAGE_CELL_WIDTH_IN / widthIn, IMAGE_CELL_HEIGHT_IN / heightIn, 1);
    return { widthIn: widthIn * scale, heightIn: heightIn * scale };
};

const resolveRowImage = async (item: SwapItemData, index: number): Promise<ResolvedImage | undefined> => {
    if (!item.imageKey) { return undefined; }

    try {
        const blob = await getImageDataFromCache(item.imageKey);
        if (!blob) { return undefined; }

        const mediaType = blob.type || 'image/jpeg';
        const extension = EXTENSION_BY_MEDIA_TYPE[mediaType] ?? 'jpg';
        const bitmap = await createImageBitmap(blob);
        const { widthIn, heightIn } = fitWithinInches(bitmap.width, bitmap.height);
        bitmap.close();

        return {
            path: `Pictures/image${index}.${extension}`,
            mediaType,
            data: await blob.arrayBuffer(),
            widthIn,
            heightIn,
        };
    } catch (error) {
        console.error('[swapExport] Failed to resolve image for export row:', error);
        return undefined;
    }
};

const getCollectionItem = (item: SwapItemData): Partial<BggCollectionItem> | undefined => item.collectionItem;

const resolveImageUrl = (item: SwapItemData): string | undefined => {
    const collectionItem = getCollectionItem(item);
    return collectionItem?.version?.image ?? collectionItem?.image ?? collectionItem?.thumbnail;
};

const resolveThumbnailUrl = (item: SwapItemData): string | undefined => getCollectionItem(item)?.thumbnail;

// Columns follow TradeItemInteropFormatProperties order, with `options`
// expanded into its own independent columns.
const allColumns: ColumnDef[] = [
    {
        header: TradeItemInteropFormatColumnHeaders.type,
        width: 'text',
        getValue: ({ item }) => getCollectionItem(item)?.subType,
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.name,
        width: 'text',
        wrap: true,
        getValue: ({ item }) => item.name,
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.bggId,
        width: 'number',
        getValue: ({ item }) => getCollectionItem(item)?.objectId,
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.year,
        width: 'number',
        getValue: ({ item }) => getCollectionItem(item)?.yearPublished,
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.condition,
        width: 'text',
        getValue: ({ item }) => item.condition ?? conditionParser(item.description),
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.description,
        width: 'text',
        wrap: true,
        getValue: ({ item }) => item.description,
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.sweetener,
        width: 'text',
        wrap: true,
        getValue: ({ item }) => item.sweetener,
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.copies,
        width: 'number',
        getValue: ({ item }) => item.copies ?? 1,
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.compareValue,
        width: 'number',
        getValue: ({ item }) => clampCompareValue(item.compareValue),
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.cashValue,
        width: 'number',
        getValue: ({ item }) => clampCashValue(item.cashValue),
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.versionName,
        width: 'text',
        wrap: true,
        getValue: ({ item }) => getCollectionItem(item)?.version?.name,
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.versionYear,
        width: 'number',
        getValue: ({ item }) => getCollectionItem(item)?.version?.yearPublished,
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.versionId,
        width: 'number',
        getValue: ({ item }) => getCollectionItem(item)?.versionId,
        cellFn: numberCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.versionLanguage,
        width: 'text',
        getValue: ({ item }) => getCollectionItem(item)?.version?.languages?.join(', '),
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.versionPublisher,
        width: 'text',
        getValue: ({ item }) => getCollectionItem(item)?.version?.publisher,
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.imageUrl,
        width: 'text',
        getValue: ({ item }) => resolveImageUrl(item),
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.thumbnailUrl,
        width: 'text',
        getValue: ({ item }) => resolveThumbnailUrl(item),
        cellFn: stringCell,
    },
    {
        header: TradeItemInteropFormatColumnHeaders.image,
        width: 'image',
        getValue: ({ image }) => image,
        cellFn: imageCell,
    },
];

const hasValue = (value: ColumnValue): boolean => value !== undefined && value !== '';

const selectPresentColumns = (rows: ResolvedRow[]): ColumnDef[] =>
    allColumns.filter(column => rows.some(row => hasValue(column.getValue(row))));

const WIDTH_STYLE_NAME: Record<ColumnWidth, string> = {
    text: 'colText',
    number: 'colNumber',
    image: 'colImage',
};

const buildHeaderRow = (columns: ColumnDef[]): string => '<table:table-row>'
    + columns.map(column => stringCell(column.header, 'coHeader')).join('')
    + '</table:table-row>';

const buildRow = (row: ResolvedRow, columns: ColumnDef[]): string => [
    '<table:table-row table:style-name="roData">',
    columns.map(column => column.cellFn(column.getValue(row), column.wrap ? 'coWrap' : undefined)),
    '</table:table-row>',
].flat().join('');

const buildContentXml = (rows: ResolvedRow[], columns: ColumnDef[]): string => {
    const dataRows = rows.map(row => buildRow(row, columns));

    return '<?xml version="1.0" encoding="UTF-8"?>'
        + '<office:document-content '
        + 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" '
        + 'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" '
        + 'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
        + 'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" '
        + 'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" '
        + 'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" '
        + 'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" '
        + 'xmlns:xlink="http://www.w3.org/1999/xlink" '
        + 'office:version="1.2">'
        + '<office:automatic-styles>'
        + '<style:style style:name="coHeader" style:family="table-cell">'
        + '<style:table-cell-properties fo:background-color="#4472c4"/>'
        + '<style:text-properties fo:color="#ffffff" fo:font-weight="bold"/>'
        + '</style:style>'
        + '<style:style style:name="coWrap" style:family="table-cell">'
        + '<style:table-cell-properties style:wrap-option="wrap" style:vertical-align="top"/>'
        + '</style:style>'
        + '<style:style style:name="roData" style:family="table-row">'
        + `<style:table-row-properties style:row-height="${IMAGE_CELL_HEIGHT_IN}in" style:use-optimal-row-height="false"/>`
        + '</style:style>'
        + '<style:style style:name="colText" style:family="table-column">'
        + '<style:table-column-properties style:column-width="2in"/>'
        + '</style:style>'
        + '<style:style style:name="colNumber" style:family="table-column">'
        + '<style:table-column-properties style:column-width="1in"/>'
        + '</style:style>'
        + '<style:style style:name="colImage" style:family="table-column">'
        + `<style:table-column-properties style:column-width="${IMAGE_CELL_WIDTH_IN}in"/>`
        + '</style:style>'
        + '</office:automatic-styles>'
        + '<office:body>'
        + '<office:spreadsheet>'
        + '<table:table table:name="Trade Export">'
        + columns.map(column => `<table:table-column table:style-name="${WIDTH_STYLE_NAME[column.width]}"/>`).join('')
        + buildHeaderRow(columns)
        + dataRows
        + '</table:table>'
        + '</office:spreadsheet>'
        + '</office:body>'
        + '</office:document-content>';
};

const buildManifestXml = (images: ResolvedImage[]): string => '<?xml version="1.0" encoding="UTF-8"?>'
    + '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">'
    + `<manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODS_MIME_TYPE}"/>`
    + '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>'
    + images.map(image =>
        `<manifest:file-entry manifest:full-path="${image.path}" manifest:media-type="${image.mediaType}"/>`
    ).join('')
    + '</manifest:manifest>';

// ── CSV export ────────────────────────────────────────────────────────────────

// RFC 4180: wrap in double quotes and double any embedded quote when the field
// contains a quote, comma, or line break.
const csvField = (value: ColumnValue): string => {
    if (value === undefined) { return ''; }
    const text = String(value);
    return /["\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (values: string[]): string => values.join(',');

// Same column selection as the ODS export, minus the embedded 'Image' column
// (CSV is text-only, so only the Image URL / Thumbnail URL columns carry over).
export const buildSwapExportCsv = (items: SwapItemData[]): string => {
    const rows: ResolvedRow[] = items.map(item => ({ item }));
    const columns = selectPresentColumns(rows).filter(column => column.width !== 'image');

    return [
        csvRow(columns.map(column => csvField(column.header))),
        ...rows.map(row => csvRow(columns.map(column => csvField(column.getValue(row))))),
    ].join('\r\n');
};

const triggerBlobDownload = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const downloadSwapExportCsv = async (items: SwapItemData[], filename = 'trade-export.csv'): Promise<void> => {
    triggerBlobDownload(new Blob([buildSwapExportCsv(items)], { type: CSV_MIME_TYPE }), filename);
};

export const buildSwapExportOds = async (items: SwapItemData[]): Promise<Blob> => {
    const rows: ResolvedRow[] = await Promise.all(
        items.map(async (item, index) => ({ item, image: await resolveRowImage(item, index) }))
    );
    const images = rows.flatMap(row => row.image ? [row.image] : []);
    const columns = selectPresentColumns(rows);

    const zip = new JSZip();
    zip.file('mimetype', ODS_MIME_TYPE, { compression: 'STORE' });
    zip.folder('META-INF')?.file('manifest.xml', buildManifestXml(images));
    zip.file('content.xml', buildContentXml(rows, columns));

    if (images.length > 0) {
        const pictures = zip.folder('Pictures');
        images.forEach(image => {
            pictures?.file(image.path.replace('Pictures/', ''), image.data);
        });
    }

    return zip.generateAsync({ type: 'blob', mimeType: ODS_MIME_TYPE });
};

export const downloadSwapExport = async (items: SwapItemData[], filename = 'trade-export.ods'): Promise<void> => {
    const blob = await buildSwapExportOds(items);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

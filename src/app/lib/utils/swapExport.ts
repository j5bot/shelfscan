import { getImageDataFromCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { MAX_NORMAL_IMAGE_SIZE, NORMAL_IMAGE_CACHE_QUALITY, rewriteImageSrc } from '@/app/lib/hooks/useCachedImage';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import JSZip from 'jszip';
import { ImageProps } from 'next/image';

const ODS_MIME_TYPE = 'application/vnd.oasis.opendocument.spreadsheet';

const IMAGE_CELL_WIDTH_IN = 1.5;
const IMAGE_CELL_HEIGHT_IN = 1.5;
const PX_PER_IN = 96;

const EXTENSION_BY_MEDIA_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

type ResolvedImage = {
    path: string;
    mediaType: string;
    data: ArrayBuffer;
    widthIn: number;
    heightIn: number;
};

type ResolvedRow = {
    item: SwapItemData;
    image?: ResolvedImage;
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

const numberCell = (value: number | undefined): string => value === undefined
    ? '<table:table-cell/>'
    : `<table:table-cell office:value-type="float" office:value="${value}"><text:p>${value}</text:p></table:table-cell>`;

const stringCell = (value: string, styleName?: string): string => {
    const styleAttr = styleName ? ` table:style-name="${styleName}"` : '';
    return `<table:table-cell${styleAttr} office:value-type="string">${textParagraphs(value)}</table:table-cell>`;
};

const imageCell = (image: ResolvedImage | undefined): string => {
    if (!image) { return '<table:table-cell/>'; }
    return `<table:table-cell>`
        + `<draw:frame svg:width="${image.widthIn.toFixed(3)}in" svg:height="${image.heightIn.toFixed(3)}in" `
        + `svg:x="0in" svg:y="0in" draw:z-index="0">`
        + `<draw:image xlink:href="${image.path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>`
        + `</draw:frame>`
        + `</table:table-cell>`;
};

const clampCompareValue = (value: number | undefined): number | undefined =>
    value === undefined ? undefined : Math.min(10, Math.max(0, value));

const clampSellFor = (value: number | undefined): number | undefined =>
    value === undefined ? undefined : Math.max(0, value);

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

const buildContentXml = (rows: ResolvedRow[]): string => {
    const headerRow = '<table:table-row>'
        + stringCell('Item Id', 'coHeader')
        + stringCell('Name', 'coHeader')
        + stringCell('Description', 'coHeader')
        + stringCell('Comparative Value', 'coHeader')
        + stringCell('Sell For', 'coHeader')
        + stringCell('Image', 'coHeader')
        + '</table:table-row>';

    const dataRows = rows.map(({ item, image }) => '<table:table-row table:style-name="roData">'
        + numberCell(item.swapItemId)
        + stringCell(item.name, 'coWrap')
        + stringCell(item.bodyText, 'coWrap')
        + numberCell(clampCompareValue(item.compareValue))
        + numberCell(clampSellFor(item.sellFor))
        + imageCell(image)
        + '</table:table-row>').join('');

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
        + '<style:style style:name="colId" style:family="table-column">'
        + '<style:table-column-properties style:column-width="0.7in"/>'
        + '</style:style>'
        + '<style:style style:name="colName" style:family="table-column">'
        + '<style:table-column-properties style:column-width="1.6in"/>'
        + '</style:style>'
        + '<style:style style:name="colDescription" style:family="table-column">'
        + '<style:table-column-properties style:column-width="3in"/>'
        + '</style:style>'
        + '<style:style style:name="colValue" style:family="table-column">'
        + '<style:table-column-properties style:column-width="1in"/>'
        + '</style:style>'
        + '<style:style style:name="colImage" style:family="table-column">'
        + `<style:table-column-properties style:column-width="${IMAGE_CELL_WIDTH_IN}in"/>`
        + '</style:style>'
        + '</office:automatic-styles>'
        + '<office:body>'
        + '<office:spreadsheet>'
        + '<table:table table:name="Swaptagon Export">'
        + '<table:table-column table:style-name="colId"/>'
        + '<table:table-column table:style-name="colName"/>'
        + '<table:table-column table:style-name="colDescription"/>'
        + '<table:table-column table:style-name="colValue"/>'
        + '<table:table-column table:style-name="colValue"/>'
        + '<table:table-column table:style-name="colImage"/>'
        + headerRow
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

export const buildSwapExportOds = async (items: SwapItemData[]): Promise<Blob> => {
    const rows: ResolvedRow[] = await Promise.all(
        items.map(async (item, index) => ({ item, image: await resolveRowImage(item, index) }))
    );
    const images = rows.flatMap(row => row.image ? [row.image] : []);

    const zip = new JSZip();
    zip.file('mimetype', ODS_MIME_TYPE, { compression: 'STORE' });
    zip.folder('META-INF')?.file('manifest.xml', buildManifestXml(images));
    zip.file('content.xml', buildContentXml(rows));

    if (images.length > 0) {
        const pictures = zip.folder('Pictures');
        images.forEach(image => {
            pictures?.file(image.path.replace('Pictures/', ''), image.data);
        });
    }

    return zip.generateAsync({ type: 'blob', mimeType: ODS_MIME_TYPE });
};

export const downloadSwapExport = async (items: SwapItemData[], filename = 'swaptagon-export.ods'): Promise<void> => {
    const blob = await buildSwapExportOds(items);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

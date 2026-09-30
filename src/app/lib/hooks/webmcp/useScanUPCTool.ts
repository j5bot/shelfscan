import { scanImage } from '@react-barcode-scanner/hooks';
import { useMcpTool } from 'webmcp-react';
import { z } from 'zod';

// z.instanceof(Blob) can't be converted to JSON Schema (webmcp-react would throw on
// registration), so check the Blob in a transform, which converts to an unconstrained `{}`
const ImageBlob = z.unknown()
    .transform((value, ctx) => {
        if (value instanceof Blob && value.type.startsWith('image/')) {
            return value;
        }
        ctx.issues.push({ code: 'custom', message: 'Expected an image Blob', input: value });
        return z.NEVER;
    })
    .meta({ description: 'Image Blob (image/* MIME type)' });

const ImageDataUri = z.string()
    .regex(/^data:image\/[\w.+-]+;base64,/, 'Expected a base64 image data URI')
    .describe('Base64 image data URI, e.g. data:image/png;base64,…');

export const ScanUPCInput = z.object({
    image: z.union([ImageDataUri, ImageBlob])
        .describe('Image containing one or more UPC barcodes'),
});

export const useScanUPCTool = () => {
    useMcpTool({
        name: 'scan_upc',
        title: 'Get UPC from data uri or image blob',
        description: 'Get UPCs from an image',
        input: ScanUPCInput,
        annotations: { readOnlyHint: true },
        handler: async ({ image}) => {
            const barcodes = (await scanImage(image))?.filter(detected =>
                detected.format.startsWith('upc')
                ).map(detected => detected.rawValue);

            return {
                content: [{
                    type: 'text',
                    text: barcodes.length > 0 ? barcodes.join('\n') : 'No UPCs found',
                }],
                structuredContent: { upcs: barcodes },
            };
        },
    });
};

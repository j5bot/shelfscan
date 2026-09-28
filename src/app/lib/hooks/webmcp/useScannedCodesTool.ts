import { useCodes } from '@/app/lib/CodesProvider';
import { useMcpTool } from 'webmcp-react';
import { z } from 'zod';

export const useScannedCodesTool = () => {
    const { codes } = useCodes();

    useMcpTool({
        name: 'list_scanned_upcs',
        title: 'List scanned UPCs',
        description: 'List the board game UPC barcodes currently in the ShelfScan scan list, in scan order.',
        input: z.object({}),
        annotations: { readOnlyHint: true },
        handler: () => ({
            content: [{
                type: 'text',
                text: codes.length ? codes.join('\n') : 'No UPCs have been scanned.',
            }],
            structuredContent: { upcs: codes },
        }),
    });
};

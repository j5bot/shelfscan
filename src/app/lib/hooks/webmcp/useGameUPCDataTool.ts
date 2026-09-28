import {
    isValidUPCA,
    isValidUPCE,
    UPC_A_PATTERN,
    UPC_E_PATTERN,
} from '@/app/lib/utils/upc';
import { useGameUPC } from 'gameupc-hooks/useGameUPC';
import { useMcpTool } from 'webmcp-react';
import { z } from 'zod';

// check digits are validated with refine, which JSON Schema ignores; the patterns are published
const UPCA = z.string()
    .regex(UPC_A_PATTERN, 'UPC-A must be 12 digits')
    .refine(isValidUPCA, 'Invalid UPC-A check digit')
    .describe('UPC-A: 12 digits including the check digit, e.g. 036000291452');

const UPCE = z.string()
    .regex(UPC_E_PATTERN, 'UPC-E must be 8 digits starting with 0 or 1')
    .refine(isValidUPCE, 'Invalid UPC-E check digit')
    .describe('UPC-E: 8 digits (number system 0 or 1, 6 data digits, check digit), e.g. 04252614');

export const GameUPCDataFromUPCInput = z.object({
    upc: z.union([UPCA, UPCE])
        .describe('Board game UPC barcode in UPC-A or UPC-E format'),
    search: z.string()
        .trim()
        .min(1, 'Search must not be blank')
        .optional()
        .describe('Game title to search for when the UPC has no verified match, e.g. "Wingspan"'),
});

export const useGameUPCDataTool = () => {
    const { getGameData } = useGameUPC();
    useMcpTool({
        name: 'gameupc_data_from_upc',
        title: 'Get GameUPC data from UPC',
        description: 'Get GameUPC data given a UPC',
        input: GameUPCDataFromUPCInput,
        annotations: { readOnlyHint: true },
        handler: async ({ upc, search }) => {
            const gameUPCData = (await getGameData(upc, search)) ?? {};

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(gameUPCData),
                }],
                structuredContent: { gameUPCData },
            };
        },
    });
};

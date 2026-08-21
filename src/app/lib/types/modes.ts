export const ComponentModes = {
    batchRating: 'batchRating',
    mathTrade: 'mathTrade',
    swap: 'swap',
    swapScan: 'swapScan',
    trade: 'trade',
    tradeScan: 'tradeScan',
} as const;
export type ComponentMode = typeof ComponentModes[keyof typeof ComponentModes];
export type ComponentModeMap = Partial<Record<ComponentMode, boolean>>;

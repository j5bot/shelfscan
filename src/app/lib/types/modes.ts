export const ComponentModes = {
    batchRating: 'batchRating',
} as const;
export type ComponentMode = typeof ComponentModes[keyof typeof ComponentModes];
export type ComponentModeMap = Partial<Record<ComponentMode, boolean>>;

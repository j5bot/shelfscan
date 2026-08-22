export const clampCompareValue = (
    value: number | undefined,
    min: number | undefined = 0,
    max: number | undefined = 10
): number | undefined =>
    value === undefined ? undefined : Math.min(max, Math.max(min, value));

export const clampCashValue = (
    value: number | undefined,
    min: number | undefined = 0
): number | undefined =>
    value === undefined ? undefined : Math.max(0, value);

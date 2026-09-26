import { thingPrefix, versionPrefix } from '@/app/lib/constants';
import { GeeklistItemData } from '@/app/lib/redux/bgg/geeklist/slice';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { BggCollectionItem } from '@/app/lib/types/bgg';

export const clampCompareValue = (
    value: number | undefined,
    min: number | undefined = 0,
    max: number | undefined = 10
): number | undefined =>
    value === undefined ? undefined : Math.min(max, Math.max(min, value));

export const clampCopies = (
    value: number | undefined,
    min: number | undefined = 1
): number | undefined =>
    value === undefined ? undefined : Math.max(min, value);

export const clampCashValue = (
    value: number | undefined,
    min: number | undefined = 0
): number | undefined =>
    value === undefined ? undefined : Math.max(0, value);

export const hasBodyText = (item?: BggCollectionItem, geeklistData?: GeeklistItemData) =>
    (geeklistData?.bodyText ?? item?.tradeCondition ?? '').length > 0;

export const hasCondition = (swapData: SwapItemData) =>
    swapData.condition && !['Other'].includes(swapData.condition as string);

export const needsDescription = (swapData: SwapItemData) =>
    !['New', 'Like New'].includes(swapData.condition as string) && (!swapData.description || swapData.description.length === 0);

export const hasDescription = (item?: BggCollectionItem, swapData?: SwapItemData) =>
    (swapData?.description ?? item?.tradeCondition ?? '').length > 0;

export const getIsValidMathTradeItem = (item?: BggCollectionItem, geeklistData?: GeeklistItemData) => {
    return hasBodyText(item, geeklistData);
};

export const getIsValidSwapItem = (item?: BggCollectionItem, swapData?: SwapItemData) => {
    return hasDescription(item, swapData);
};

export const getIsValidTradeItem = (item?: BggCollectionItem, swapData?: SwapItemData) => {
    if (!swapData) {
        return false;
    }
    return needsDescription(swapData) ?
           (hasDescription(item, swapData) && hasCondition(swapData))
                                      : hasCondition(swapData);
};

/** Swaptagon item description: the user's text followed by the BGG thing (and version) links. */
export const makeSwapDescription = (
    bodyText: string,
    item: Partial<BggCollectionItem>,
) => {
    return `${bodyText}

${thingPrefix}${item.objectId}${item.versionId !== undefined ? `
${versionPrefix}${item.versionId}` : ''}`;
};

export type TradeActionMode = {
    hasExport: boolean;
    isMathTrade: boolean;
    isSwap: boolean;
    isTrade: boolean;
};

const pluralGames = (count: number) => `${count} game${count !== 1 ? 's' : ''}`;

/** Visible label and accessible label for the bulk trade/export action button. */
export const getTradeActionLabels = (mode: TradeActionMode, count: number) => {
    const ariaLabel = mode.hasExport
        ? `Export ${pluralGames(count)} to ODS`
        : `Add ${pluralGames(count)} to math trade geeklist`;
    switch (true) {
        case mode.isSwap:
            return { label: `Export ${count} for Swaptagon`, ariaLabel };
        case mode.isTrade:
            return { label: `Export ${count} for Atlas`, ariaLabel };
        default:
            return { label: `Add ${count} to Math Trade`, ariaLabel };
    }
};

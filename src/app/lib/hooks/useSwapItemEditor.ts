import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { setItemData } from '@/app/lib/redux/swap/slice';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { TradeItemCondition } from '@/app/lib/types/trade';
import { conditionParser } from '@/app/lib/utils/condition';
import { getSwapItemImageCacheKey } from '@/app/lib/utils/swapExport';
import { clampCashValue, clampCompareValue, clampCopies } from '@/app/lib/utils/trade';
import { useCallback } from 'react';

const CASH_VALUE_MIN = -1;

/** Swap/trade export data for one item (Redux `swap` slice), seeded from the collection item. */
export const useSwapItemEditor = (item: Partial<BggCollectionItem> | undefined, collectionId: number | string | undefined) => {
    const dispatch = useDispatch();
    const savedData = useSelector(
        (state: RootState) => state.swap.data[collectionId!],
    );

    const { isSwap, isTrade } = useTradeMode();

    const description = savedData?.description ?? item?.tradeCondition;
    const condition = savedData?.condition ?? conditionParser(description);

    const needsDescription = (isSwap || (isTrade && !['New', 'Like New'].includes(condition as string))) &&
        (!description || description.length === 0);

    const name = item?.name ?? collectionId!.toString() ?? '';

    const compareValueMin = isTrade ? 0 : 1;
    const compareValueMax = isTrade ? Number.MAX_SAFE_INTEGER : 10;

    const handleDescriptionChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, name, description: value }));
    }, [dispatch, collectionId, name]);

    const handleSweetenerChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, name, sweetener: value }));
    }, [dispatch, collectionId, name]);

    const handleConditionChange = useCallback((value: TradeItemCondition) => {
        dispatch(setItemData({ collectionId, name, condition: value }));
    }, [dispatch, collectionId, name]);

    const handleCompareValueChange = useCallback((value: number) => {
        dispatch(setItemData({
            collectionId,
            compareValue: clampCompareValue(value, compareValueMin, compareValueMax)
        }));
    }, [dispatch, collectionId, compareValueMin, compareValueMax]);

    const handleCashValueChange = useCallback((value: number | undefined) => {
        dispatch(setItemData({
            collectionId,
            cashValue: clampCashValue(value, CASH_VALUE_MIN)
        }));
    }, [dispatch, collectionId]);

    const handleCopiesChange = useCallback((value: number | undefined) => {
        dispatch(setItemData({
            collectionId,
            copies: clampCopies(value)
        }));
    }, [dispatch, collectionId]);

    // seed the swap data once when the item first becomes available; later
    // edits to savedData must not re-run this (used by the owning component's effect)
    const initializeItemData = useCallback(() => {
        if (!item) {
            return;
        }
        dispatch(setItemData({
            collectionId,
            name: item.name ?? collectionId!.toString() ?? '',
            condition: savedData?.condition ?? conditionParser(savedData?.description ?? item.tradeCondition ?? ''),
            description: savedData?.description ?? item.tradeCondition,
            imageKey: getSwapItemImageCacheKey(item as BggCollectionItem),
        }));
    }, [dispatch, item, collectionId, savedData]);

    return {
        initializeItemData,
        isTrade,
        description,
        sweetener: savedData?.sweetener,
        condition,
        compareValue: savedData?.compareValue ?? 1,
        cashValue: savedData?.cashValue ?? 0,
        copies: savedData?.copies,
        needsDescription,
        compareValueMin,
        handleDescriptionChange,
        handleSweetenerChange,
        handleConditionChange,
        handleCompareValueChange,
        handleCashValueChange,
        handleCopiesChange,
    };
};

import { useSelector } from '@/app/lib/hooks';
import { useOLWLGMathTrade } from '@/app/lib/hooks/useOLWLGMathTrade';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { RootState } from '@/app/lib/redux/store';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { BggCollection } from '@/app/lib/types/bgg';
import { getBggImageFromItem } from '@/app/lib/utils/bggImageId';
import { buildMathTradeBody } from '@/app/lib/utils/mathTradeFormat';
import { downloadSwapExport, getSwapItemImageCacheKey } from '@/app/lib/utils/swapExport';
import {
    getIsValidMathTradeItem,
    getIsValidSwapItem,
    getIsValidTradeItem,
    makeSwapDescription,
} from '@/app/lib/utils/trade';
import { useCallback, useMemo, useState } from 'react';

type MathTrade = ReturnType<typeof useOLWLGMathTrade>;

type UseTradeSelectionOptions = Pick<MathTrade, 'activeGeekListId' | 'geeklist' | 'geeklistData' | 'submitMathTrade'> & {
    collection: BggCollection | undefined;
};

export type SwapExportFn = (items: SwapItemData[], filename?: string) => Promise<void>;

/**
 * Items selected for a math trade or a swap/trade export, which of them are
 * complete enough to act on, and the bulk add / export actions.
 */
export const useTradeSelection = ({
    collection,
    activeGeekListId,
    geeklist,
    geeklistData,
    submitMathTrade,
}: UseTradeSelectionOptions) => {
    const { hasExport, isMathTrade, isSwap, isTrade } = useTradeMode();
    const swapData = useSelector((state: RootState) => state.swap.data);

    const [selectedMathTradeIds, setSelectedMathTradeIds] = useState<Set<number>>(new Set());
    const [pendingMathTradeToggleId, setPendingMathTradeToggleId] = useState<number | null>(null);
    const [isExportingSwap, setIsExportingSwap] = useState(false);

    const actionableTradeItemIds = useMemo(() => (hasExport || (isMathTrade && activeGeekListId)) ?
        Array.from(selectedMathTradeIds).reduce((actionable, collectionId) => {
            const item = collection?.items[collectionId];
            if (!item) {
                return actionable;
            }
            switch (true) {
                case isMathTrade && !getIsValidMathTradeItem(item, geeklistData[collectionId]):
                    return actionable;
                case isSwap && !getIsValidSwapItem(item, swapData[collectionId]):
                    return actionable;
                case isTrade && !getIsValidTradeItem(item, swapData[collectionId]):
                    return actionable;
            }
            actionable.add(collectionId);
            return actionable;
        }, new Set<number>()) : new Set<number>(), [
        hasExport,
        isMathTrade,
        isSwap,
        isTrade,
        activeGeekListId,
        selectedMathTradeIds,
        collection,
        geeklistData,
        swapData,
    ]);

    const actionableTradeItemsCount = actionableTradeItemIds.size;

    const handleMathTradeToggle = useCallback((collectionId: number) => {
        if (!selectedMathTradeIds.has(collectionId)) {
            const item = collection?.items[collectionId];
            if (item && activeGeekListId !== null) {
                const inGeeklist = (geeklist?.games[item.objectId]?.length ?? 0) > 0;
                if (inGeeklist) {
                    setPendingMathTradeToggleId(collectionId);
                    return;
                }
            }
        }
        setSelectedMathTradeIds(prev => {
            const next = new Set(prev);
            if (next.has(collectionId)) {
                next.delete(collectionId);
            } else {
                next.add(collectionId);
            }
            return next;
        });
    }, [collection, geeklist, activeGeekListId, selectedMathTradeIds]);

    const cancelPendingToggle = useCallback(() => {
        setPendingMathTradeToggleId(null);
    }, []);

    const confirmPendingToggle = useCallback(() => {
        const id = pendingMathTradeToggleId;
        setPendingMathTradeToggleId(null);
        if (id === null) {
            return;
        }
        setSelectedMathTradeIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, [pendingMathTradeToggleId]);

    const handleBulkMathTradeAdd = useCallback(async () => {
        if (actionableTradeItemsCount === 0) { return; }

        const items = Array.from(actionableTradeItemIds).flatMap(collectionId => {
            const item = collection?.items[collectionId];
            if (!item) { return []; }
            const savedData = geeklistData[collectionId];
            const bodyText = savedData?.bodyText ?? item.tradeCondition ?? '';
            const copies = savedData?.copies ?? 1;
            return [{
                collectionId,
                gameId: item.objectId,
                versionId: item.versionId,
                name: item.name,
                body: buildMathTradeBody(bodyText, item, copies, collectionId),
                description: bodyText,
                copies,
                imageId: getBggImageFromItem(item),
            }];
        });

        const success = await submitMathTrade(items);
        if (success) {
            setSelectedMathTradeIds(new Set());
        }
    }, [actionableTradeItemIds, actionableTradeItemsCount, collection, geeklistData, submitMathTrade]);

    const handleSwapExport = useCallback(async (exportFn: SwapExportFn = downloadSwapExport) => {
        if (actionableTradeItemsCount === 0) { return; }

        const items: SwapItemData[] = Array.from(actionableTradeItemIds).flatMap(collectionId => {
            const item = collection?.items[collectionId];
            if (!item) { return []; }
            const savedData = swapData[collectionId];
            const description = savedData?.description ?? item.tradeCondition ?? '';
            return [{
                collectionItem: item,
                collectionId,
                swapItemId: savedData?.swapItemId,
                name: item.version?.name ? `${item.name} (${item.version.name})`
                       : (savedData?.name ?? item.name),
                description: isSwap ? makeSwapDescription(
                    description,
                    item,
                ) : description,
                condition: savedData?.condition,
                sweetener: savedData?.sweetener,
                compareValue: savedData?.compareValue ?? 1,
                cashValue: savedData?.cashValue ?? 0,
                copies: savedData?.copies ?? 1,
                imageKey: savedData?.imageKey ?? getSwapItemImageCacheKey(item),
            }];
        });

        setIsExportingSwap(true);
        try {
            await exportFn(items);
            setSelectedMathTradeIds(new Set());
        } finally {
            setIsExportingSwap(false);
        }
    }, [actionableTradeItemIds, actionableTradeItemsCount, collection, swapData, isSwap]);

    return {
        selectedMathTradeIds,
        actionableTradeItemsCount,
        pendingMathTradeToggleId,
        isExportingSwap,
        handleMathTradeToggle,
        cancelPendingToggle,
        confirmPendingToggle,
        handleBulkMathTradeAdd,
        handleSwapExport,
    };
};

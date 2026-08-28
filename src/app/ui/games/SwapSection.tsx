import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { setItemData } from '@/app/lib/redux/swap/slice';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { ComponentModeMap } from '@/app/lib/types/modes';
import { TradeItemInteropFormat } from '@/app/lib/types/trade';
import { conditionParser, TIER_ABBREVIATION } from '@/app/lib/utils/condition';
import { getSwapItemImageCacheKey } from '@/app/lib/utils/swapExport';
import { clampCashValue, clampCompareValue } from '@/app/lib/utils/trade';
import { memo, useCallback, useEffect, useState } from 'react';

type SwapCondition = TradeItemInteropFormat['condition'];

const CONDITION_OPTIONS: { value: SwapCondition; label: string }[] = [
    { value: undefined, label: 'Condition' },
    { value: 'New', label: 'New' },
    { value: 'Like New', label: 'Like New' },
    { value: 'Very Good', label: 'Very Good' },
    { value: 'Good', label: 'Good' },
    { value: 'Acceptable', label: 'Acceptable' },
    { value: 'Other', label: 'Other' },
];

type CollectionItemSwapSectionProps = {
    collectionId: number | string;
};

type ScanSwapSectionProps = {
    upc: string;
    item: Partial<BggCollectionItem>;
};

export const CollectionItemSwapSection = memo((props: CollectionItemSwapSectionProps) => {
    const { collectionId } = props;
    const username = useSelector((state: RootState) => state.bgg.user.user?.toLowerCase() ?? '');
    const item = useSelector((state: RootState) =>
        state.bgg.collection.users[username]?.items[collectionId as number]
    ) as Partial<BggCollectionItem>;

    return <SwapSectionInner item={item} collectionId={collectionId} />;
});

export const ScanSwapSection = memo(({ upc, item }: ScanSwapSectionProps) => {
    return <SwapSectionInner item={item} collectionId={upc} />
});

ScanSwapSection.displayName = 'ScanSwapSection';

export const SwapSectionInner = ({
    item,
    collectionId,
}: Partial<CollectionItemSwapSectionProps & ScanSwapSectionProps>) => {
    const dispatch = useDispatch();
    const savedData = useSelector(
        (state: RootState) => state.swap.data[collectionId!],
    );

    const { isSwap, isTrade } = useTradeMode();

    useEffect(() => {
        if (!item) {
            return;
        }
        dispatch(setItemData({
            collectionId,
            name: item.name ?? collectionId!.toString() ?? '',
            condition: savedData?.condition ?? conditionParser(savedData?.description ?? item.tradeCondition ?? ''),
            description: savedData?.description ?? item.tradeCondition ?? '',
            imageKey: getSwapItemImageCacheKey(item as BggCollectionItem),
        }));
    }, [!item]);

    const [expanded, setExpanded] = useState(false);

    const defaultDescription = item?.tradeCondition;
    const description = savedData?.description ?? defaultDescription;
    const sweetener = savedData?.sweetener;
    const condition = savedData?.condition ?? conditionParser(description);
    const compareValue = savedData?.compareValue ?? 1;
    const cashValue = savedData?.cashValue ?? 0;

    const needsDescription =  (isSwap || (isTrade && !['New', 'Like New'].includes(condition as string))) &&
        (!description || description.length === 0);

    const name = item?.name ?? collectionId!.toString() ?? ''

    const compareValueMin = isTrade ? 0 : 1;
    const compareValueMax = isTrade ? Number.MAX_SAFE_INTEGER : 10;

    const cashValueMin = -1;

    const handleDescriptionChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, name, description: value.length > 0 ? value : undefined }));
    }, [dispatch, collectionId, name]);

    const handleSweetenerChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, name, sweetener: value.length > 0 ? value : undefined }));
    }, [dispatch, collectionId, name]);

    const handleConditionChange = useCallback((value: SwapCondition) => {
        dispatch(setItemData({ collectionId, name, condition: value }));
    }, [dispatch, collectionId, name]);

    const handleCompareValueChange = useCallback((value: number) => {
        dispatch(setItemData({
            collectionId,
            compareValue: clampCompareValue(value, compareValueMin, compareValueMax)
        }));
    }, [dispatch, collectionId, compareValue]);

    const handleCashValueChange = useCallback((value: number | undefined) => {
        dispatch(setItemData({
            collectionId,
            cashValue: clampCashValue(value, cashValueMin)
        }));
    }, [dispatch, collectionId, cashValue]);

    if (!item) { return null; }

    return <div className="mt-2 border-t border-base-content/15 pt-2">
        {expanded ? (
            <div className="flex flex-col gap-2">
                <textarea
                    className="textarea textarea-bordered w-full text-xs resize-y min-h-16 p-1.5"
                    value={description}
                    onChange={e => handleDescriptionChange(e.target.value)}
                    placeholder="Trade condition / description"
                    aria-label="Trade condition / description for math trade"
                />
                {isTrade && <textarea
                    className="textarea textarea-bordered w-full text-xs resize-y min-h-4 p-1.5"
                    value={sweetener}
                    onChange={e => handleSweetenerChange(e.target.value)}
                    placeholder="Sweeteners"
                    aria-label="Sweeteners for math trade"
                />}
                <div className="flex flex-wrap items-center gap-1">
                    {isTrade && (
                        <div className="flex items-center gap-0.5">
                            <label
                                className="text-xs text-base-content/70"
                                htmlFor={`condition-${collectionId}`}
                            >
                                Condition
                            </label>
                            <select
                                id={`condition-${collectionId}`}
                                className="select select-bordered select-xs ml-px"
                                value={condition ?? ''}
                                onChange={e => handleConditionChange(
                                    e.target.value === '' ? undefined : e.target.value as SwapCondition,
                                )}
                                aria-label="Trade condition"
                            >
                                {CONDITION_OPTIONS.map(option => (
                                    <option key={option.label} value={option.value ?? ''}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center gap-0.5">
                        <label
                            className="text-xs text-base-content/70"
                            htmlFor={`compareValue-${collectionId}`}
                        >
                            Compare
                        </label>
                        <input
                            id={`compareValue-${collectionId}`}
                            type="number"
                            className={`input input-bordered input-xs ml-px ${isTrade ? 'w-12' : 'w-10'}`}
                            min={compareValueMin}
                            value={compareValue}
                            onChange={e => handleCompareValueChange(
                                parseInt(e.target.value, 10) || 1,
                            )}
                            aria-label="Comparative value"
                        />
                    </div>
                    <div className="flex items-center gap-0.5">
                        <label
                            className="text-xs text-base-content/70 text-nowrap"
                            htmlFor={`cashValue-${collectionId}`}
                        >
                            Sell For
                        </label>
                        <input
                            id={`cashValue-${collectionId}`}
                            type="number"
                            className="input input-bordered input-xs ml-px w-12"
                            value={cashValue >= 0 ? cashValue : undefined}
                            onChange={e => {
                                const numberValue = parseInt(e.target.value, 10);
                                handleCashValueChange(
                                     isNaN(numberValue) ? undefined : numberValue,
                                )
                            }}
                            aria-label="Cash value"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        className="btn btn-xs btn-ghost ml-auto"
                        onClick={() => setExpanded(false)}
                        aria-label="Collapse swap editor"
                    >
                        Done
                    </button>
                </div>
            </div>
        ) : (
            <button
                type="button"
                className="w-full text-left cursor-pointer relative"
                onClick={() => setExpanded(true)}
                aria-label="Edit swap entry"
                aria-expanded={false}
            >
                <pre className={`text-xs whitespace-pre-wrap wrap-break-word
                    font-encode-condensed text-base-content/90
                    bg-base-200 rounded p-2 h-16 overflow-y-auto`}>
                    {description}
                </pre>
                {needsDescription && <div className="absolute top-0.5 left-1 text-xl">
                    ⚠️
                </div>}
                {isTrade && condition && condition.length && <div
                    className={`font-encode-condensed
                    font-semibold
                    px-1.5
                    text-xs text-white
                    badge badge-pill
                    absolute top-0.5 right-0.5
                    bg-gray-400`}
                    >{TIER_ABBREVIATION[condition]}</div>}
            </button>
        )}
    </div>;
};

CollectionItemSwapSection.displayName = 'CollectionItemSwapSection';

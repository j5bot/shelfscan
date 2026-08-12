import { useDispatch, useSelector } from '@/app/lib/hooks';
import { setItemData } from '@/app/lib/redux/swap/slice';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { getSwapItemImageCacheKey } from '@/app/lib/utils/swapExport';
import { memo, useCallback, useEffect, useState } from 'react';

type CollectionItemSwapSectionProps = {
    collectionId: number | string;
};

type ScanSwapSectionProps = {
    upc: string;
    item: Partial<BggCollectionItem>;
};

export const CollectionItemSwapSection = memo(({ collectionId }: CollectionItemSwapSectionProps) => {
    const username = useSelector((state: RootState) => state.bgg.user.user?.toLowerCase() ?? '');
    const item = useSelector((state: RootState) =>
        state.bgg.collection.users[username]?.items[collectionId as number]
    ) as Partial<BggCollectionItem>;

    return <SwapSectionInner item={item} collectionId={collectionId} />
});

export const ScanSwapSection = memo(({ upc, item }: ScanSwapSectionProps) => {
    return <SwapSectionInner item={item} collectionId={upc} />
});

ScanSwapSection.displayName = 'ScanSwapSection';

export const SwapSectionInner = ({
    item,
    collectionId,
}: { item: Partial<BggCollectionItem>, collectionId: number | string }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!item) {
            return;
        }
        dispatch(setItemData({
            collectionId,
            name: item.name ?? collectionId.toString() ?? '',
            bodyText: item.tradeCondition ?? '',
            imageKey: getSwapItemImageCacheKey(item as BggCollectionItem),
        }));
    }, [!item]);

    const savedData = useSelector(
        (state: RootState) => state.swap.data[collectionId],
    );

    const [expanded, setExpanded] = useState(false);

    const defaultBodyText = item?.tradeCondition ?? '';
    const bodyText = savedData?.bodyText ?? defaultBodyText;
    const compareValue = savedData?.compareValue ?? 1;
    const sellFor = savedData?.sellFor ?? 0;

    const name = item?.name ?? collectionId.toString() ?? '';

    const handleBodyChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, name, bodyText: value }));
    }, [dispatch, collectionId, name]);

    const handleCompareValueChange = useCallback((value: number) => {
        dispatch(setItemData({ collectionId, name, bodyText, compareValue: value }));
    }, [dispatch, collectionId, name, bodyText, compareValue]);

    const handleSellForChange = useCallback((value: number) => {
        dispatch(setItemData({ collectionId, name, bodyText, sellFor: value }));
    }, [dispatch, collectionId, name, bodyText, sellFor]);

    if (!item) { return null; }

    return <div className="mt-2 border-t border-base-content/15 pt-2">
        {expanded ? (
            <div className="flex flex-col gap-2">
                <textarea
                    className="textarea textarea-bordered w-full text-xs resize-y min-h-16 p-1.5"
                    value={bodyText}
                    onChange={e => handleBodyChange(e.target.value)}
                    placeholder="Trade condition / description"
                    aria-label="Trade condition / description for math trade"
                />
                <div className="flex flex-wrap items-center gap-0.5">
                    <label
                        className="text-xs text-base-content/70"
                        htmlFor={`compareValue-${collectionId}`}
                    >
                        Compare
                    </label>
                    <input
                        id={`compareValue-${collectionId}`}
                        type="number"
                        className="input input-bordered input-xs ml-px w-10"
                        min={1}
                        value={compareValue}
                        onChange={e => handleCompareValueChange(
                            Math.max(1, parseInt(e.target.value, 10) || 1),
                        )}
                        aria-label="Comparative value"
                    />
                    <label
                        className="text-xs text-base-content/70 text-nowrap"
                        htmlFor={`compareValue-${collectionId}`}
                    >
                        Sell For
                    </label>
                    <input
                        id={`sellFor-${collectionId}`}
                        type="number"
                        className="input input-bordered input-xs ml-px w-12"
                        min={0}
                        value={sellFor}
                        onChange={e => handleSellForChange(
                            Math.max(0, parseInt(e.target.value, 10) || 0),
                        )}
                        aria-label="Sell for value"
                    />
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
                    {bodyText}
                </pre>
                {bodyText.length === 0 && <div className="absolute top-0.5 left-1 text-xl">
                    ⚠️
                </div>}
            </button>
        )}
    </div>;
};

CollectionItemSwapSection.displayName = 'CollectionItemSwapSection';

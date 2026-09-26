import { useSelector } from '@/app/lib/hooks';
import { useSwapItemEditor } from '@/app/lib/hooks/useSwapItemEditor';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { TradeItemCondition } from '@/app/lib/types/trade';
import { TIER_ABBREVIATION } from '@/app/lib/utils/condition';
import { memo, useEffect, useEffectEvent, useState } from 'react';

const CONDITION_OPTIONS: { value: TradeItemCondition; label: string }[] = [
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

type SwapEditor = ReturnType<typeof useSwapItemEditor>;

/** empty or non-numeric input means "no value" */
const parseOptionalInt = (value: string) => {
    const numberValue = parseInt(value, 10);
    return isNaN(numberValue) ? undefined : numberValue;
};

const ConditionPicker = ({ condition, onChange }: { condition?: string; onChange: (value: TradeItemCondition) => void }) =>
    <div className="flex space-between gap-[2%]">
        {CONDITION_OPTIONS.filter(option => option.value !== 'Other').map(option => (
            <button key={option.value} className={`btn btn-xs btn-ghost rounded-md w-fit px-0 grow h-5
                ${condition === option.value
                  ? 'text-white bg-purple-400'
                  : 'border-gray-300 text-base-content/50'}
                `}
                aria-pressed={condition === option.value}
                aria-label={option.label}
                title={option.label}
                onClick={() => onChange(option.value)}>
                {TIER_ABBREVIATION[option.value]}
            </button>
        ))}
    </div>;

const SwapNumberFields = ({ editor, collectionId }: { editor: SwapEditor; collectionId?: number | string }) =>
    <div className="flex flex-wrap items-center gap-1">
        <div className="flex items-center gap-0.5">
            <label
                className="text-xs text-base-content/70 min-w-16 w-fit"
                htmlFor={`compareValue-${collectionId}`}
            >
                Compare
            </label>
            <input
                id={`compareValue-${collectionId}`}
                type="number"
                className={`input input-bordered input-xs ml-px ${editor.isTrade ? 'w-12' : 'w-10'}`}
                min={editor.compareValueMin}
                value={editor.compareValue}
                onChange={e => editor.handleCompareValueChange(
                    parseInt(e.target.value, 10) || 1,
                )}
                aria-label="Comparative value"
            />
        </div>
        <div className="flex items-center gap-0.5">
            <label
                className="text-xs text-base-content/70 min-w-16 w-fit text-nowrap"
                htmlFor={`cashValue-${collectionId}`}
            >
                <div className="flex justify-between"><div>Sell For</div><div>$</div></div>
            </label>
            <input
                id={`cashValue-${collectionId}`}
                type="number"
                step="1"
                className="input input-bordered input-xs ml-px w-12"
                value={editor.cashValue >= 0 ? editor.cashValue : undefined}
                onChange={e => editor.handleCashValueChange(parseOptionalInt(e.target.value))}
                aria-label="Cash value"
            />
        </div>
        {editor.isTrade && <div className="flex items-center gap-0.5">
            <label
                className="text-xs text-base-content/70 min-w-16 w-fit text-nowrap"
                htmlFor={`copies-${collectionId}`}
            >
                Copies
            </label>
            <input
                id={`copies-${collectionId}`}
                type="number"
                className="input input-bordered input-xs ml-px w-12"
                value={(editor.copies ?? 0) >= 0 ? editor.copies : undefined}
                onChange={e => editor.handleCopiesChange(parseOptionalInt(e.target.value))}
                aria-label="Copies"
            />
        </div>}
    </div>;

const SwapSummary = ({ editor, onExpand }: { editor: SwapEditor; onExpand: () => void }) =>
    <button
        type="button"
        className="w-full text-left cursor-pointer relative"
        onClick={onExpand}
        aria-label="Edit swap entry"
        aria-expanded={false}
    >
        <pre className={`text-xs whitespace-pre-wrap wrap-break-word
            font-encode-condensed text-base-content/90
            bg-base-200 rounded p-2 h-16 overflow-y-auto`}>
            {editor.description}
        </pre>
        {editor.needsDescription && <div className="absolute top-0.5 left-1 text-xl">
            ⚠️
        </div>}
        {editor.isTrade && !!editor.condition && <div
            className={`font-encode-condensed
            font-semibold
            px-1.5
            text-xs text-white
            badge badge-pill
            absolute top-0.5 right-0.5
            bg-gray-400`}
            >{TIER_ABBREVIATION[editor.condition]}</div>}
    </button>;

export const SwapSectionInner = ({
    item,
    collectionId,
}: Partial<CollectionItemSwapSectionProps & ScanSwapSectionProps>) => {
    const editor = useSwapItemEditor(item, collectionId);
    const [expanded, setExpanded] = useState(false);

    // seed once when the item first becomes available, not on every savedData change
    const seedItemData = useEffectEvent(() => editor.initializeItemData());
    const hasItem = !!item;
    useEffect(() => {
        seedItemData();
    }, [hasItem]);

    if (!item) { return null; }

    return <div className="mt-2 border-t border-base-content/15 pt-2">
        {expanded ? (
            <div className="flex flex-col gap-2">
                {editor.isTrade && (
                    <ConditionPicker condition={editor.condition} onChange={editor.handleConditionChange} />
                )}
                <textarea
                    className="textarea textarea-bordered w-full text-xs resize-y min-h-16 p-1.5"
                    value={editor.description}
                    onChange={e => editor.handleDescriptionChange(e.target.value)}
                    placeholder="Trade condition / description"
                    aria-label="Trade condition / description for math trade"
                />
                {editor.isTrade && <textarea
                    className="textarea textarea-bordered w-full text-xs resize-y min-h-4 p-1.5"
                    value={editor.sweetener}
                    onChange={e => editor.handleSweetenerChange(e.target.value)}
                    placeholder="Sweeteners"
                    aria-label="Sweeteners for math trade"
                />}
                <SwapNumberFields editor={editor} collectionId={collectionId} />
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
            <SwapSummary editor={editor} onExpand={() => setExpanded(true)} />
        )}
    </div>;
};

CollectionItemSwapSection.displayName = 'CollectionItemSwapSection';

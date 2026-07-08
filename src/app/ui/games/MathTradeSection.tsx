import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useMathTrade } from '@/app/lib/hooks/useMathTrade';
import {
    recordAdd,
    setItemData,
    UNKNOWN_GEEKLIST_ITEM_ID,
} from '@/app/lib/redux/bgg/geeklist/slice';
import { RootState } from '@/app/lib/redux/store';
import { getBggImageFromItem, getBggImageId } from '@/app/lib/utils/bggImageId';
import { buildMathTradeBody } from '@/app/lib/utils/mathTradeFormat';
import { memo, useCallback, useState } from 'react';

type MathTradeSectionProps = {
    collectionId: number;
};

export const MathTradeSection = memo(({ collectionId }: MathTradeSectionProps) => {
    const dispatch = useDispatch();
    const { canUseExtension, sendViaExtension } = useMathTrade();

    const item = useSelector((state: RootState) => {
        const username = state.bgg.user.user?.toLowerCase() ?? '';
        return state.bgg.collection.users[username]?.items[collectionId];
    });

    const activeGeekListId = useSelector(
        (state: RootState) => state.bgg.geeklist.activeGeekListId,
    );
    const savedData = useSelector(
        (state: RootState) => state.bgg.geeklist.data[collectionId],
    );
    const isInGeeklist = useSelector((state: RootState) => {
        if (activeGeekListId === null || !item) { return false; }
        return (state.bgg.geeklist.geekLists[activeGeekListId]?.games[item.objectId]?.length ?? 0) > 0;
    });

    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

    const defaultBodyText = item?.tradeCondition ?? '';
    const bodyText = savedData?.bodyText ?? defaultBodyText;
    const copies = savedData?.copies ?? 1;

    const handleBodyChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, bodyText: value, copies }));
    }, [dispatch, collectionId, copies]);

    const handleCopiesChange = useCallback((value: number) => {
        dispatch(setItemData({ collectionId, bodyText, copies: value }));
    }, [dispatch, collectionId, bodyText]);

    const handleAdd = useCallback(async () => {
        if (!item || activeGeekListId === null) { return; }
        setError(null);
        setSending(true);

        const body = buildMathTradeBody(bodyText, item, copies, collectionId);
        const imageId = getBggImageFromItem(item);

        if (canUseExtension) {
            const [result] = await sendViaExtension([{
                collectionId,
                gameId: item.objectId,
                versionId: item.versionId,
                name: item.name,
                body,
                imageId,
            }]);
            setSending(false);
            if (!result?.success) {
                setError(result?.error ?? 'Failed to add to geeklist');
            }
            return;
        }

        // No extension — open new tab
        const url = new URL(`https://boardgamegeek.com/geeklist/${activeGeekListId}`);
        url.searchParams.set('addListitem', '1');
        url.searchParams.set('addListitemType', 'things');
        url.searchParams.set('addListitemId', item.objectId.toString());
        url.searchParams.set('addListitemImageid', imageId.toString());
        url.searchParams.set('addListitemBody', body);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');

        dispatch(recordAdd({
            collectionId,
            geeklistItemId: UNKNOWN_GEEKLIST_ITEM_ID,
            geekListId: activeGeekListId,
            gameId: item.objectId,
            versionId: item.versionId,
        }));
        setSending(false);
    }, [item, activeGeekListId, bodyText, copies, collectionId, canUseExtension, sendViaExtension, dispatch]);

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
                <div className="flex items-center gap-0.5">
                    <label
                        className="text-xs text-base-content/70"
                        htmlFor={`copies-${collectionId}`}
                    >
                        Copies
                    </label>
                    <input
                        id={`copies-${collectionId}`}
                        type="number"
                        className="input input-bordered input-xs ml-0.5 w-8"
                        min={1}
                        value={copies}
                        onChange={e => handleCopiesChange(
                            Math.max(1, parseInt(e.target.value, 10) || 1),
                        )}
                        aria-label="Number of copies"
                    />
                    <button
                        type="button"
                        className="btn btn-xs btn-ghost ml-auto"
                        onClick={() => setExpanded(false)}
                        aria-label="Collapse math trade editor"
                    >
                        Done
                    </button>
                </div>
            </div>
        ) : (
            <button
                type="button"
                className="w-full text-left cursor-pointer"
                onClick={() => setExpanded(true)}
                aria-label="Edit math trade entry"
                aria-expanded={false}
            >
                <pre className={`text-xs whitespace-pre-wrap wrap-break-word
                    font-encode-condensed text-base-content/90
                    bg-base-200 rounded p-2 h-16 overflow-y-auto`}>
                    {bodyText}
                </pre>
            </button>
        )}
        {error && (
            <p className="text-xs text-error mt-1" role="alert">{error}</p>
        )}
        <button
            type="button"
            className={`btn rounded-full w-full mt-2
                ${isInGeeklist ? 'btn-warning' : 'bg-[#e07ca4] text-white'}
                uppercase text-xs font-sharetech
                pt-1 pb-1
                ${sending ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={() => { if (isInGeeklist) { setShowDuplicateConfirm(true); } else { void handleAdd(); } }}
            disabled={sending}
            aria-label={`Add ${item.name} to math trade`}
        >
            {sending
                ? <span className="loading loading-bars loading-xs" />
                : 'Add to Trade'
            }
        </button>
        {showDuplicateConfirm && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                onClick={() => setShowDuplicateConfirm(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Already in geeklist"
            >
                <div
                    className="relative bg-base-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="text-lg font-semibold mb-2">Already in Geeklist</h2>
                    <p className="text-sm text-base-content/70 mb-4">
                        This game is already in your math trade geeklist. Add it again?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setShowDuplicateConfirm(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => { setShowDuplicateConfirm(false); void handleAdd(); }}
                        >
                            Add Again
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>;
});

MathTradeSection.displayName = 'MathTradeSection';

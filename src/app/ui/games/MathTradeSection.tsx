import { useDispatch, useSelector } from '@/app/lib/hooks';
import {
    recordAdd,
    setItemData,
    UNKNOWN_GEEKLIST_ITEM_ID,
} from '@/app/lib/redux/bgg/geeklist/slice';
import { RootState } from '@/app/lib/redux/store';
import { getBggImageId } from '@/app/lib/utils/bggImageId';
import { buildMathTradeBody } from '@/app/lib/utils/mathTradeFormat';
import { memo, useCallback, useState } from 'react';

type MathTradeSectionProps = {
    collectionId: number;
};

export const MathTradeSection = memo(({ collectionId }: MathTradeSectionProps) => {
    const dispatch = useDispatch();

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

    const [expanded, setExpanded] = useState(false);

    const defaultBodyText = item?.tradeCondition ?? '';
    const bodyText = savedData?.bodyText ?? defaultBodyText;
    const copies = savedData?.copies ?? 1;

    const handleBodyChange = useCallback((value: string) => {
        dispatch(setItemData({ collectionId, bodyText: value, copies }));
    }, [dispatch, collectionId, copies]);

    const handleCopiesChange = useCallback((value: number) => {
        dispatch(setItemData({ collectionId, bodyText, copies: value }));
    }, [dispatch, collectionId, bodyText]);

    const handleAdd = useCallback(() => {
        if (!item || activeGeekListId === null) { return; }

        const formattedBody = buildMathTradeBody(bodyText, item.versionId, copies, collectionId);
        const imageId = getBggImageId(item.thumbnail ?? item.image);

        const url = new URL(`https://boardgamegeek.com/geeklist/${activeGeekListId}`);
        url.searchParams.set('addListitem', '1');
        url.searchParams.set('addListitemType', 'things');
        url.searchParams.set('addListitemId', item.objectId.toString());
        url.searchParams.set('addListitemImageid', imageId.toString());
        url.searchParams.set('addListitemBody', formattedBody);

        window.open(url.toString(), '_blank', 'noopener,noreferrer');

        dispatch(recordAdd({
            collectionId,
            geeklistItemId: UNKNOWN_GEEKLIST_ITEM_ID,
            geekListId: activeGeekListId,
            gameId: item.objectId,
            versionId: item.versionId,
        }));
    }, [item, activeGeekListId, bodyText, copies, collectionId, dispatch]);

    if (!item) { return null; }

    const formattedBlock = buildMathTradeBody(bodyText, item.versionId, copies, collectionId);

    return <div className="mt-2 border-t border-base-content/15 pt-2">
        {expanded ? (
            <div className="flex flex-col gap-2">
                <textarea
                    className="textarea textarea-bordered w-full text-xs resize-y min-h-16"
                    value={bodyText}
                    onChange={e => handleBodyChange(e.target.value)}
                    placeholder="Trade condition / body text"
                    aria-label="Body text for geeklist entry"
                />
                <div className="flex items-center gap-2">
                    <label
                        className="text-xs text-base-content/70"
                        htmlFor={`copies-${collectionId}`}
                    >
                        Copies
                    </label>
                    <input
                        id={`copies-${collectionId}`}
                        type="number"
                        className="input input-bordered input-xs w-16"
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
                    font-mono text-base-content/70
                    bg-base-200 rounded p-2 h-14 overflow-y-auto`}>
                    {bodyText}
                </pre>
            </button>
        )}
        <button
            type="button"
            className={`btn rounded-full w-full mt-2
                bg-[#e07ca4] text-white
                uppercase text-xs font-sharetech
                pt-1 pb-1`}
            onClick={handleAdd}
            aria-label={`Add ${item.name} to math trade geeklist`}
        >
            Add to Geeklist
        </button>
    </div>;
});

MathTradeSection.displayName = 'MathTradeSection';

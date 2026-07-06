import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useSync } from '@/app/lib/extension/useSync';
import { DocumentMessageDetail, Game } from '@/app/lib/extension/messageTypes';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { recordAdd, UNKNOWN_GEEKLIST_ITEM_ID } from '@/app/lib/redux/bgg/geeklist/slice';
import { RootState } from '@/app/lib/redux/store';
import { useCallback } from 'react';

export type MathTradeItem = {
    collectionId: number;
    gameId: number;
    versionId?: number;
    name: string;
    body: string;
    imageId: number;
};

export type MathTradeResult = {
    collectionId: number;
    success: boolean;
    error?: string;
};

export const useMathTrade = () => {
    const { syncOn } = useSync();
    const userId = useSelector((state: RootState) => state.bgg.user?.id);
    const activeGeekListId = useSelector(
        (state: RootState) => state.bgg.geeklist.activeGeekListId,
    );
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const dispatch = useDispatch();

    const canUseExtension = !!(syncOn && userId);

    const sendViaExtension = useCallback(async (
        items: MathTradeItem[],
    ): Promise<MathTradeResult[]> => {
        if (!userId || activeGeekListId === null) {
            return items.map(item => ({
                collectionId: item.collectionId,
                success: false,
                error: 'Extension not ready',
            }));
        }

        const games: Game[] = items.map(item => {
            const { name, collectionId, gameId, versionId = 0, body, imageId } = item;

            return {
                userId,
                name,
                collectionId,
                gameId,
                versionId,
                formValues: { body, imageId, geeklistId: activeGeekListId },
                timestamp: Date.now(),
            };
        });

        const response = await dispatchExtensionMessage({
            type: 'mathTrade',
            games,
            timestamp: Date.now(),
        } as unknown as Partial<DocumentMessageDetail>);

        if (!response) {
            return items.map(item => ({
                collectionId: item.collectionId,
                success: false,
                error: 'No response from extension',
            }));
        }

        const responseData = response.response as Record<string, unknown> | null | undefined;
        const errorMsg = responseData?.error ? String(responseData.error) : undefined;

        if (errorMsg) {
            return items.map(item => ({
                collectionId: item.collectionId,
                success: false,
                error: errorMsg,
            }));
        }

        // Dispatch recordAdd for each successfully added item
        const listItemId = (responseData?.listItemId ?? responseData?.listitemid) as number | undefined;

        return items.map(item => {
            dispatch(recordAdd({
                collectionId: item.collectionId,
                geeklistItemId: listItemId ?? UNKNOWN_GEEKLIST_ITEM_ID,
                geekListId: activeGeekListId,
                gameId: item.gameId,
                versionId: item.versionId,
            }));
            return { collectionId: item.collectionId, success: true };
        });
    }, [userId, activeGeekListId, dispatchExtensionMessage, dispatch]);

    return { syncOn, canUseExtension, sendViaExtension };
};

import { DocumentMessageResponseDetail } from '@/app/lib/extension/messageTypes';
import { AddPlayParams } from '@/app/lib/extension/messaging/addPlay';
import { updateNumPlays } from '@/app/lib/redux/bgg/collection/slice';

export const syncNumPlays = (
    params: AddPlayParams,
    detail: DocumentMessageResponseDetail | undefined
) => {
    const { collectionId, dispatch, username } = params;
    const { numplays } = (detail?.response ?? {}) as { numplays?: number };
    if (numplays != null && collectionId && username) {
        dispatch(updateNumPlays({
            username,
            collectionId,
            numplays,
        }));
    }
};

import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useCallback } from 'react';

type CreateAddRatingParams = {
    collectionId?: number;
    gameId?: number;
    versionId?: number;
    name?: string;
};

export const useRating = () => {
    const userId = useSelector((state: RootState) => state.bgg.user?.id);

    const { dispatchExtensionMessage } = useExtensionMessaging();

    const createAddRating = useCallback(({
        collectionId,
        gameId,
        versionId,
        name,
    }: CreateAddRatingParams) => () => {
        if (!userId) {
            return;
        }
        const formName = `rating-form-${collectionId ?? gameId ?? 'unknown'}`;
        const form = document.forms.namedItem(formName ?? '');
        const formData = form ? new FormData(form) : undefined;

        dispatchExtensionMessage({
            userId,
            type: 'ratings',
            collectionId,
            name,
            gameId,
            versionId,
            formValues: Object.fromEntries(formData ?? []),
        });
    }, [userId, dispatchExtensionMessage]);

    return { createAddRating };
};
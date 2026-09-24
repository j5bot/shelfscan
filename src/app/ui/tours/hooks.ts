import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { CardComponentProps } from 'nextstepjs';
import { useEffect, useEffectEvent, useMemo } from 'react';

export type NextStepFn = CardComponentProps['nextStep'];

export const useCollectionSelectors = () => {
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    const collection = useSelector((state: RootState) =>
        state.bgg.collection?.users[currentUsername ?? '']);

    return useMemo(() => ({
        currentUsername,
        collection,
    }), [currentUsername, collection]);
};

export const useUsername = (nextStep: NextStepFn) => {
    const { currentUsername } = useCollectionSelectors();
    const advance = useEffectEvent(() => nextStep());

    useEffect(() => {
        if (!currentUsername) {
            return;
        }
        advance();
    }, [currentUsername]);
};

export const useCollection = (nextStep: NextStepFn) => {
    const { collection } = useCollectionSelectors();
    const advance = useEffectEvent(() => nextStep());

    useEffect(() => {
        if (!collection) {
            return;
        }
        advance();
    }, [collection]);
};

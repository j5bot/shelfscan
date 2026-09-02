import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { CardComponentProps } from 'nextstepjs';
import { useEffect, useMemo } from 'react';

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
    useEffect(() => {
        if (!currentUsername) {
            return;
        }
        nextStep();
    }, [currentUsername]);
};

export const useCollection = (nextStep: NextStepFn) => {
    const { collection } = useCollectionSelectors();

    useEffect(() => {
        if (!collection) {
            return;
        }
        nextStep();
    }, [collection]);
};

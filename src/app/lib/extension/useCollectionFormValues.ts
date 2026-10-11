import { SetFormValues } from '@/app/lib/extension/types';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import {
    CollectionFormState,
    resolveCollectionFormValues,
    statusesToFormValue,
} from '@/app/lib/utils/collectionFormValues';
import { useCallback, useMemo, useState } from 'react';

/** The extension forms' values: trade condition and statuses follow the collection item; other fields keep edits. */
export const useCollectionFormValues = (collectionItem: BggCollectionItem | undefined) => {
    const [formState, setFormState] = useState<CollectionFormState>({ values: {} });

    const currentTradeCondition = collectionItem?.tradeCondition as string | undefined;
    const currentStatuses = statusesToFormValue(collectionItem?.statuses);
    const formValues = useMemo(
        () => resolveCollectionFormValues(formState, {
            tradecondition: currentTradeCondition,
            statuses: currentStatuses,
        }),
        [formState, currentTradeCondition, currentStatuses],
    );
    const setFormValues = useCallback<SetFormValues>(action => {
        const against = { tradecondition: currentTradeCondition, statuses: currentStatuses };
        setFormState(prev => {
            const current = resolveCollectionFormValues(prev, against);
            return {
                values: typeof action === 'function' ? action(current) : action,
                against,
            };
        });
    }, [currentTradeCondition, currentStatuses]);

    return { formValues, setFormValues };
};

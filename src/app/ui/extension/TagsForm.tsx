import { ModeSettingFormProps } from '@/app/lib/extension/types';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import React from 'react';

export type TagsFormProps = {
    field: string;
    placeholder: string;
    collectionId: number;
};

export const TagsForm = ({
    formValues,
    setFormValues,
    field,
    placeholder,
    collectionId,
}:ModeSettingFormProps & TagsFormProps) => {

    const item = useSelector((state: RootState) => {
        const username = state.bgg.user.user?.toLowerCase() ?? '';
        return state.bgg.collection.users[username].items[collectionId ?? 0]
    });

    return <form name="tags" className="pt-1">
        <textarea
            name={field}
            className="textarea textarea-md text-sm p-2"
            placeholder={placeholder}
            defaultValue={formValues?.[field] ?? item?.[field as keyof BggCollectionItem]}
            onChange={event => setFormValues(
                Object.assign(formValues, { [field]: event.currentTarget.value })
            )}
        />
    </form>
};

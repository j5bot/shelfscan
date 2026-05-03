import { BggCollectionItem, BggCollectionStatuses } from '@/app/lib/types/bgg';
import { ReactNode } from 'react';

export type FormValues = Record<string, string>;
export type SetFormValues = (formValues: FormValues) => void;
export type SetFormValue = (field: string, value: string) => void;

export type Modes = {
    collection: 'add' | 'trade' | 'previous' | 'clear' | 'wishlist' | 'sell' | 'info';
    play: 'quick' | 'detailed';
};

export type DisabledModes = {
    collection: boolean;
    play: boolean;
};

export type ModeSettingFormProps = {
    formValues: Record<string, string>;
    setFormValues: SetFormValues;
};

export type CollectionModeSetting = {
    label: ReactNode;
    listText?: string;
    icon: ReactNode;
    width: string;
    form?: (props: ModeSettingFormProps) => ReactNode;
    shouldShow?: (statuses: BggCollectionStatuses | null, update: boolean) => boolean;
    validator?: (formData: FormData) => boolean;
    message?: (
        userId: string,
        dispatchExtensionMessage: (detail: object) => void,
        collectionItem: BggCollectionItem
    ) => void;
}
export type CollectionModeSettings = Record<Modes['collection'], CollectionModeSetting>;

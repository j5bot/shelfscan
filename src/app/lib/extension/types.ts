import { BggCollectionItem, BggCollectionStatuses } from '@/app/lib/types/bgg';
import { Dispatch, ReactNode, SetStateAction, SyntheticEvent } from 'react';

export type FormValues = Record<string, string>;
export type SetFormValues = Dispatch<SetStateAction<FormValues>>;
export type SetFormValue = (field: string, value: string) => void;

export const CollectionModes = [
    'add', 'trade', 'previous', 'clear', 'wishlist', 'sell', 'info'
] as const;
export type CollectionModes = typeof CollectionModes[number];
export const PlayModes = [
    'quick', 'detailed'
] as const;
export type PlayModes = typeof PlayModes[number];
export const TagModes = [
    'choose', 'wishlist', 'wantsparts', 'hasparts'
] as const;
export type TagModes = typeof TagModes[number];

export type Modes = {
    collection: CollectionModes;
    play: PlayModes;
    tags: TagModes;
};

export type DisabledModes = Record<keyof Modes, boolean>;

export type ModeSettingFormProps = {
    formValues: Record<string, string>;
    setFormValues: SetFormValues;
    addFn?: (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => void;
    onClose?: () => void;
    gameName?: string;
};

export type ModeSetting = {
    updateOnly?: boolean;
    label: ReactNode;
    listText?: string;
    icon: ReactNode;
    width: string;
    form?: (props: ModeSettingFormProps) => ReactNode;
    shouldShow?: (statuses: BggCollectionStatuses | null, update: boolean) => boolean;
    validator?: (formValues: Record<string, string>) => boolean;
    message?: (
        userId: string,
        dispatchExtensionMessage: (detail: object) => void,
        collectionItem: BggCollectionItem
    ) => void;
    addFn?: (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => void;
}
export type CollectionModeSettings = Record<Modes['collection'], ModeSetting>;
export type PlayModeSettings = Record<Modes['play'], ModeSetting>;
export type TagsModeSettings = Record<Modes['tags'], ModeSetting>;
export type ModeSettings = Record<Modes[keyof Modes], ModeSetting>
export type ModeSettingKey = keyof ModeSettings;

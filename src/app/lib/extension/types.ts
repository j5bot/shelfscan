import { ReactNode } from 'react';

export type FormValues = Record<string, string>;
export type SetFormValues = (formValues: FormValues) => void;
export type SetFormValue = (field: string, value: string) => void;

export type Modes = {
    collection: 'add' | 'trade' | 'previous' | 'clear' | 'wishlist' | 'sell';
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

export type ModeSetting = {
    label: ReactNode;
    listText?: string;
    icon: ReactNode;
    width: string;
    form?: (props: ModeSettingFormProps) => ReactNode;
    validator?: (formData: FormData) => boolean;
}
export type CollectionModeSettings = Record<Modes['collection'], ModeSetting>;
export type PlayModeSettings = Record<Modes['play'], ModeSetting>;

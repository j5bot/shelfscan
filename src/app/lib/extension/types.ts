import { ReactNode } from 'react';

export type FormValues = Record<string, string>;
export type SetFormValues = (formValues: FormValues) => void;
export type SetFormValue = (field: string, value: string) => void;

export type Modes = {
    addToCollection: 'add' | 'trade' | 'wishlist' | 'sell';
    addPlay: 'quick' | 'detailed';
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
export type ModeSettings = Record<Modes['addToCollection'], ModeSetting>;

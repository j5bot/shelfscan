import { FormValues } from '@/app/lib/extension/types';

/** The form fields that follow the collection item: when the item's value changes, it replaces the user's edit. */
export type CollectionFormFields = {
    tradecondition?: string;
    statuses: string;
};

/** Accumulated form values, kept with the collection fields they were last set against. */
export type CollectionFormState = {
    values: FormValues;
    against?: CollectionFormFields;
};

/** The item's statuses as the comma-separated list the forms use, e.g. `own,fortrade`. */
export const statusesToFormValue = (statuses?: Record<string, boolean>) =>
    Object.entries(statuses ?? {})
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(',');

/**
 * The form values to use: the accumulated values, with each collection field replaced by the
 * item's current value if the item has changed it since the values were last set (or they never were).
 */
export const resolveCollectionFormValues = (state: CollectionFormState, current: CollectionFormFields): FormValues => {
    const { values, against } = state;
    const resolved = { ...values };
    if (!against || against.tradecondition !== current.tradecondition) {
        resolved.tradecondition = current.tradecondition as string;
    }
    if (!against || against.statuses !== current.statuses) {
        resolved.statuses = current.statuses;
    }
    return resolved;
};

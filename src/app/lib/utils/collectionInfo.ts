import { FormValues } from '@/app/lib/extension/types';
import { PossibleStatus, PossibleStatuses } from '@/app/lib/types/bgg';

export type InfoFieldKind = 'text' | 'statuses' | 'currency' | 'price' | 'date';

type InfoField = {
    kind: InfoFieldKind;
    /** Shown in the info form */
    label: string;
    /** For tools and other non-visual uses */
    description: string;
};

/** The fields of the collection item info form (AddInfoForm), keyed by the form value the extension saves. */
export const InfoFormFields = {
    privatecomment: {
        kind: 'text',
        label: 'Private Comment',
        description: 'Private comment, only visible to the user',
    },
    statuses: {
        kind: 'statuses',
        label: 'Statuses',
        description: 'Every collection status the item should have; any status left out is turned off',
    },
    tradecondition: {
        kind: 'text',
        label: 'Trade Condition',
        description: 'Condition of the copy, shown to other traders',
    },
    pp_currency: {
        kind: 'currency',
        label: 'Paid Currency',
        description: 'Currency of the price paid',
    },
    pricepaid: {
        kind: 'price',
        label: 'Paid',
        description: 'Price paid',
    },
    cv_currency: {
        kind: 'currency',
        label: 'Value Currency',
        description: 'Currency of the current value',
    },
    currvalue: {
        kind: 'price',
        label: 'Value',
        description: 'Current value',
    },
    acquisitiondate: {
        kind: 'date',
        label: 'Acquisition Date',
        description: 'Date the copy was acquired, as YYYY-MM-DD',
    },
    acquiredfrom: {
        kind: 'text',
        label: 'Acq. Note',
        description: 'Where or who the copy was acquired from',
    },
    invdate: {
        kind: 'date',
        label: 'Inventory Date',
        description: 'Date the copy was last inventoried, as YYYY-MM-DD',
    },
    invlocation: {
        kind: 'text',
        label: 'Inv. Note',
        description: 'Inventory location or note',
    },
} as const satisfies Record<string, InfoField>;

export type InfoFormField = keyof typeof InfoFormFields;

export const INFO_FORM_FIELD_NAMES = Object.keys(InfoFormFields) as InfoFormField[];

// fields BGG keeps as plain collection item properties; the others are read from `status` and `textfield`
const PLAIN_INFO_FIELDS = INFO_FORM_FIELD_NAMES
    .filter(field => !['privatecomment', 'statuses', 'tradecondition'].includes(field));

/** BGG's collection item (`/api/collectionitems/:id`), as the extension's infoLoad reply carries it. */
export type InfoLoadItem = Record<string, unknown> & {
    objectid?: string | number;
    status?: Record<string, boolean>;
    textfield?: {
        privatecomment?: { value?: string };
        conditiontext?: { value?: string };
    };
};

export type InfoValues = Partial<Record<InfoFormField, string>>;

/** The info form values from a loaded collection item; fields BGG has no value for are left out. */
export const readLoadedInfo = (item: InfoLoadItem | undefined): InfoValues => {
    if (!item) {
        return {};
    }
    const values: InfoValues = {};
    PLAIN_INFO_FIELDS.forEach(field => {
        const value = item[field];
        if (value != null && value !== '') {
            values[field] = String(value);
        }
    });
    const privatecomment = item.textfield?.privatecomment?.value;
    if (privatecomment) {
        values.privatecomment = privatecomment;
    }
    const tradecondition = item.textfield?.conditiontext?.value ?? item.tradecondition;
    if (tradecondition) {
        values.tradecondition = String(tradecondition);
    }
    if (item.status) {
        values.statuses = PossibleStatuses.filter(status => item.status?.[status]).join(',');
    }
    return values;
};

export type InfoUpdates = Partial<Record<InfoFormField, string | number | PossibleStatus[]>>;

/** Info updates as form values: statuses become the form's comma-separated list, numbers strings. */
export const infoUpdatesToFormValues = (updates: InfoUpdates): InfoValues =>
    Object.fromEntries(Object.entries(updates)
        .filter(([, value]) => value !== undefined)
        .map(([field, value]) => [field, Array.isArray(value) ? value.join(',') : String(value)]));

/**
 * The form values to save: the loaded info with the updates on top, so unchanged fields are re-sent as loaded
 * (older extension versions clear the private comment when it isn't sent).
 */
export const mergeInfoFormValues = (loaded: InfoValues, updates: InfoUpdates): FormValues =>
    ({ ...loaded, ...infoUpdatesToFormValues(updates) }) as FormValues;

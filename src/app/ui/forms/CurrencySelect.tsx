import { SetFormValue } from '@/app/lib/extension/types';
import { CURRENCIES } from '@/app/lib/utils/currencies';
import React from 'react';

// the empty option leaves the currency unset
const currencies = [{ value: undefined, label: '' }, ...CURRENCIES];

type CurrencySelectProps = {
    id?: string;
    currency: string;
    disabled?: boolean;
    setValue: SetFormValue;
    field?: string;
    label?: string;
};

export const CurrencySelect = (props: CurrencySelectProps) => {
    const {
        id,
        currency,
        disabled,
        setValue,
        field = 'currency',
        label = 'Currency',
    } = props;

    return <select id={id} name={field} aria-label={label} className={`text-left select select-sm
            select-condensed
            h-7 w-24 pl-1.5 p-0`}
            value={currency}
            disabled={disabled}
            onChange={event =>
                setValue(field, event.currentTarget.value)}
    >
        {currencies.map(currency =>
            <option key={currency.value ?? 'empty-currency'}
                    value={currency.value}>{currency.label}</option>
        )}
</select>;
};

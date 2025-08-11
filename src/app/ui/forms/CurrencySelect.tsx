import { SetFormValue } from '@/app/lib/extension/types';
import React from 'react';

const currencies = [
    { value: undefined, label: '' },
    { value: 'USD', label: 'US$' },
    { value: 'EUR', label: 'EU€' },
    { value: 'GBP', label: 'GB£' },
    { value: 'CAD', label: 'CA$' },
    { value: 'AUD', label: 'AU$' },
    { value: 'NZD', label: 'NZ$' },
    { value: 'BRL', label: 'R$' },
    { value: 'MXN', label: 'MX$' },
    { value: 'CHF', label: 'SFr' },
    { value: 'CZK', label: 'Kč' },
    { value: 'DKK', label: 'DKK' },
    { value: 'SEK', label: 'SEK' },
    { value: 'HUF', label: 'Ft' },
    { value: 'ILS', label: '₪' },
    { value: 'NOK', label: 'NOK' },
    { value: 'PLN', label: 'zł' },
    { value: 'JPY', label: '¥' },
    { value: 'CNY', label: '元' },
    { value: 'HKD', label: 'HK$' },
    { value: 'MYR', label: 'RM' },
    { value: 'TWD', label: 'NT$' },
    { value: 'PHP', label: '₱' },
    { value: 'SGD', label: 'S$' },
    { value: 'THB', label: '฿' },
];

export const CurrencySelect = ({
    currency, disabled, setValue
}:
    { currency: string; disabled?: boolean, setValue: SetFormValue }
) =>
    <select name="currency" className={`text-left select select-sm
            select-condensed
            h-7 w-24 pl-1.5 p-0`}
            value={currency}
            disabled={disabled}
            onChange={event =>
                setValue('currency', event.currentTarget.value)}
    >
        {currencies.map(currency =>
            <option key={currency.value}
                    value={currency.value}>{currency.label}</option>
        )}
</select>;

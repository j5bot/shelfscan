import { SetFormValue } from '@/app/lib/extension/types';
import React from 'react';

export const PriceInput = ({
    disabled,
    price,
    setValue,
    field = 'price',
    label = 'Price',
}: {
    disabled?: boolean;
    price: string | number;
    setValue: SetFormValue;
    field?: string;
    label?: string;
}) => {
    // the input owns the draft while typing and commits on blur; keying by the
    // committed price resets the draft whenever that value changes
    return <input
        key={price}
        type="text"
        name={field}
        className="input text-sm h-7 pl-1.5 pt-1 pb-1 grow"
        placeholder={label}
        defaultValue={price}
        disabled={disabled}
        onBlur={event =>
            setValue(field, event.currentTarget.value)
        }
    />
};

import { SetFormValue } from '@/app/lib/extension/types';
import React, { ChangeEvent, useEffect, useState } from 'react';

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
    const [tempValue, setTempValue] = useState<string>(price.toString());

    useEffect(() => {
        setTempValue(price.toString());
    }, [price]);

    const changeHandler = (event: ChangeEvent<HTMLInputElement>) =>
        setTempValue(event.currentTarget.value);

    return <input
        type="text"
        name={field}
        className="input text-sm h-7 pl-1.5 pt-1 pb-1 grow"
        placeholder={label}
        value={disabled ? price : tempValue}
        disabled={disabled}
        onChange={changeHandler}
        onBlur={event =>
            setValue(field, event.currentTarget.value)
        }
    />
};

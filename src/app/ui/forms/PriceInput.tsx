import { SetFormValue } from '@/app/lib/extension/types';
import React, { ChangeEvent, useEffect, useState } from 'react';

export const PriceInput = ({
    disabled,
    price,
    setValue,
}: {
    disabled?: boolean;
    price: string | number;
    setValue: SetFormValue
}) => {
    const [tempValue, setTempValue] = useState<string>(price.toString());

    useEffect(() => {
        setTempValue(price.toString());
    }, [price]);

    const changeHandler = (event: ChangeEvent<HTMLInputElement>) =>
        setTempValue(event.currentTarget.value);

    return <input
        type="text"
        name="price"
        className="input text-sm h-7 pl-1.5 pt-1 pb-1"
        placeholder="Price"
        value={disabled ? price : tempValue}
        disabled={disabled}
        onChange={changeHandler}
        onBlur={event =>
            setValue('price', event.currentTarget.value)
        }
    />
};

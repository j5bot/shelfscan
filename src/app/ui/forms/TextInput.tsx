import { SetFormValue } from '@/app/lib/extension/types';
import React, { ChangeEvent, useEffect, useState } from 'react';

export const TextInput = ({
    disabled,
    text,
    setValue,
    field = 'price',
    label = 'Price',
}: {
    disabled?: boolean;
    text: string;
    setValue: SetFormValue;
    field?: string;
    label?: string;
}) => {
    const [tempValue, setTempValue] = useState<string>(text);

    useEffect(() => {
        setTempValue(text);
    }, [text]);

    const changeHandler = (event: ChangeEvent<HTMLInputElement>) =>
        setTempValue(event.currentTarget.value);

    return <input
        type="text"
        name={field}
        className="input text-sm h-7 pl-1.5 pt-1 pb-1"
        placeholder={label}
        value={disabled ? text : tempValue}
        disabled={disabled}
        onChange={changeHandler}
        onBlur={event =>
            setValue(field, event.currentTarget.value)
        }
    />
};

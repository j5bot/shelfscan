import { SetFormValue } from '@/app/lib/extension/types';
import React from 'react';

type TextInputProps = {
    disabled?: boolean;
    text: string;
    setValue: SetFormValue;
    field?: string;
    label?: string;
};

export const TextInput = (props: TextInputProps) => {
    const {
        disabled,
        text,
        setValue,
        field = 'price',
        label = 'Price',
    } = props;

    // the input owns the draft while typing and commits on blur; keying by the
    // committed text resets the draft whenever that value changes
    return <input
        key={text}
        type="text"
        name={field}
        className="input text-sm h-7 pl-1.5 pt-1 pb-1"
        placeholder={label}
        defaultValue={text}
        disabled={disabled}
        onBlur={event =>
            setValue(field, event.currentTarget.value)
        }
    />
};

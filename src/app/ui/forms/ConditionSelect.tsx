import { SetFormValue } from '@/app/lib/extension/types';
import React from 'react';

const conditions = [
    { value: undefined, label: 'Condition' },
    { value: 'new', label: 'New' },
    { value: 'likenew', label: 'Like New' },
    { value: 'verygood', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'acceptable', label: 'Acceptable' },
];

export const ConditionSelect = ({ condition, setValue }:
    { condition: string; setValue: SetFormValue }
) => (
    <select name="condition"
            className="select select-sm h-7 pl-1.5 p-1 pr-0"
            defaultValue={condition}
            onChange={event =>
                setValue('condition', event.currentTarget.value)}
    >
        {conditions.map(condition => {
            return <option key={condition.value}
                           value={condition.value}>{condition.label}</option>
        })}
    </select>
);

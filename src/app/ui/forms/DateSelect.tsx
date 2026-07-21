import { SetFormValue } from '@/app/lib/extension/types';
import { useEffect, useState } from 'react';
import { DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const DateSelect = ({
        date, disabled, setValue, field = 'currency', label = 'Date'
    }:
    { date: string; disabled?: boolean; setValue: SetFormValue; field?: string; label?: string }
) => {
    const [currentDate, setCurrentDate] = useState<string>(date);
    const [isDefaultDate, setIsDefaultDate] = useState<boolean>(!date);

    useEffect(() => {
        if (!date || date === currentDate) {
            return;
        }
        setCurrentDate(date);
        setIsDefaultDate(false);
    }, [date]);

    return <DatePicker className={`input text-xs h-7 w-21.5 pl-1.5 pt-1 pb-1 ${isDefaultDate ? 'bg-gray-300' : ''}`.trim()}
                       disabled={disabled}
                       selected={currentDate ? new Date(currentDate) : new Date()}
                       onChange={(newDate: Date | null) => {
                           if (!newDate) {
                               return;
                           }
                           setCurrentDate(newDate.toISOString());
                           setIsDefaultDate(false);
                           setValue(field, newDate.toISOString());
                       }}
                       popperClassName="z10important"
                       popperPlacement="top-end"
                       aria-label={label}
                       />
};

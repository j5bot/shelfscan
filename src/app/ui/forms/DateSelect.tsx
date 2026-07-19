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

    useEffect(() => {
        if (date === currentDate) {
            return;
        }
        setCurrentDate(date);
    }, [date]);

    return <DatePicker className="input text-xs h-7 w-21.5 pl-1.5 pt-1 pb-1"
                       disabled={disabled}
                       selected={currentDate ? new Date(currentDate) : new Date()}
                       onChange={(newDate: Date | null) => {
                           if (!newDate) {
                               return;
                           }
                           setCurrentDate(newDate.toISOString());
                           setValue(field, newDate.toISOString());
                       }}
                       popperClassName="z10important"
                       popperPlacement="top-end"
                       aria-label={label}
                       />
};

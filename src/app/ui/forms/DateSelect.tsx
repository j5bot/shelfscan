import { SetFormValue } from '@/app/lib/extension/types';
import { DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const DateSelect = ({
        date, disabled, setValue, field = 'currency', label = 'Date'
    }:
    { date: string; disabled?: boolean; setValue: SetFormValue; field?: string; label?: string }
) => {
    return <DatePicker className="input text-xs h-7 w-22 pl-1.5 pt-1 pb-1"
                       disabled={disabled}
                       selected={date ? new Date(date) : new Date()}
                       onChange={(newDate: Date | null) => {
                           if (!newDate) {
                               return;
                           }
                           setValue(field, newDate.toISOString());
                       }}
                       aria-label={label}
                       />
};

import { SetFormValue } from '@/app/lib/extension/types';
import { DatePicker } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type DateSelectProps = {
    date: string;
    disabled?: boolean;
    setValue: SetFormValue;
    field?: string;
    label?: string;
};

export const DateSelect = (props: DateSelectProps) => {
    const {
        date,
        disabled,
        setValue,
        field = 'currency',
        label = 'Date',
    } = props;

    const isDefaultDate = !date;

    return <DatePicker className={`input text-xs h-7 w-21.5 pl-1.5 pt-1 pb-1 ${isDefaultDate ? 'bg-gray-300' : ''}`.trim()}
                       disabled={disabled}
                       selected={date ? new Date(date) : new Date()}
                       onChange={(newDate: Date | null) => {
                           if (!newDate) {
                               return;
                           }
                           setValue(field, newDate.toISOString());
                       }}
                       popperClassName="z10important"
                       popperPlacement="top-end"
                       aria-label={label}
                       />
};

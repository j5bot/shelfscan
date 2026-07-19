import { SetFormValue } from '@/app/lib/extension/types';
import {
    PossibleStatuses,
    PossibleStatusesLabels
} from '@/app/lib/types/bgg';
import { useEffect, useState } from 'react';

const statusesOptions = PossibleStatuses
    .map((status, index) => ({
        value: status, label: PossibleStatusesLabels[index],
    }));

export const StatusSelect = ({
    statuses = [],
    setValue
} : {
    statuses?: string[];
    setValue: SetFormValue;
}) => {
    const [statusesValues, setStatusesValues] =
        useState<string[] | undefined>(statuses);

    const statusesKey = statuses.join(',');
    useEffect(() => {
        setStatusesValues(statuses);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusesKey]);

    const toggleStatus = (status: string, checked: boolean) => {
        const values = checked
            ? [...(statusesValues ?? []), status]
            : (statusesValues ?? []).filter(value => value !== status);
        setStatusesValues(values);
        setValue('statuses', values.join(','));
    };

    const summary = statusesOptions
        .filter(status => statusesValues?.includes(status.value))
        .map(status => status.label)
        .join(', ') || 'Select Statuses';

    return <>
        <input type="hidden" name="statusesKey"
               value={statusesValues?.join(',')} />
        <div className="collapse collapse-arrow collapse-xs text-xs">
            <input type="checkbox" />
            <div className="collapse-title p-1.5 m-0 truncate">{summary}</div>
            <div className="collapse-content flex flex-wrap gap-1 pr-1 pl-1">
                {statusesOptions.map(status =>
                    <label key={status.value} className="flex items-center gap-1">
                        <input type="checkbox"
                               className="checkbox checkbox-xs rounded-sm"
                               checked={statusesValues?.includes(status.value) ?? false}
                               onChange={event =>
                                   toggleStatus(status.value, event.currentTarget.checked)
                               }
                        />
                        {status.label}
                    </label>
                )}
            </div>
        </div>
    </>
};

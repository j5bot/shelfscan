import { SetFormValue } from '@/app/lib/extension/types';
import {
    PossibleStatuses,
    PossibleStatusesLabels
} from '@/app/lib/types/bgg';
import { useState } from 'react';

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
    // the user's selection, kept with the prop value it was made against so a new prop resets it
    const statusesKey = statuses.join(',');
    const [override, setOverride] = useState<{ key: string; values: string[] }>();
    const statusesValues = override?.key === statusesKey ? override.values : statuses;

    const toggleStatus = (status: string, checked: boolean) => {
        const values = checked
            ? [...(statusesValues ?? []), status]
            : (statusesValues ?? []).filter(value => value !== status);
        setOverride({ key: statusesKey, values });
        setValue('statuses', values.join(','));
    };

    const selectedStatuses = new Set(statusesValues);
    const summary = statusesOptions
        .filter(status => selectedStatuses.has(status.value))
        .map(status => status.label)
        .join(', ') || 'Select Statuses';

    return <>
        <input type="hidden" name="statusesKey"
               value={statusesValues?.join(',')} />
        <div className="collapse collapse-arrow collapse-xs text-xs">
            <input type="checkbox" aria-label={`Statuses: ${summary}`} />
            <div className="collapse-title p-1.5 m-0 truncate">{summary}</div>
            <div className="collapse-content flex flex-wrap gap-1 pr-1 pl-1">
                {statusesOptions.map(status =>
                    <label key={status.value} className="flex items-center gap-1">
                        <input type="checkbox"
                               className="checkbox checkbox-xs rounded-sm"
                               checked={selectedStatuses.has(status.value)}
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

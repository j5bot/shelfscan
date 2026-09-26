import { SortDirection } from '@/app/lib/hooks/useFilterSort';
import { FaArrowDown, FaArrowUp, FaArrowUpWideShort } from 'react-icons/fa6';

export type SortFieldOption<F extends string> = {
    field: F;
    label: string;
};

type SortControlsProps<F extends string> = {
    sortFields: SortFieldOption<F>[];
    sortField: F;
    sortDirection: SortDirection;
    onSortClick: (field: F) => void;
};

export const SortControls = <F extends string>(props: SortControlsProps<F>) => {
    const { sortFields, sortField, sortDirection, onSortClick } = props;
    const isAscending = sortDirection === 'asc';

    return <div className="flex gap-1 items-center" id="sort-controls">
        <FaArrowUpWideShort size={14}
                            className="shrink-0 text-base-content/50"
                            aria-hidden="true" />
        <div className="flex items-center gap-1 shrink-0">
            <select
                className="select select-bordered select-sm rounded-sm w-25 pl-2"
                value={sortField}
                onChange={e => onSortClick(e.target.value as F)}
                aria-label="Sort by field"
            >
                {sortFields.map(({ field, label }) => (
                    <option key={field} value={field}>{label}</option>
                ))}
            </select>
            <button
                type="button"
                className="btn btn-xs pl-0.5 pr-0.5"
                onClick={() => onSortClick(sortField)}
                aria-label={isAscending ? 'Sort ascending' : 'Sort descending'}
                title={isAscending ? 'Ascending' : 'Descending'}
            >
                {isAscending
                 ? <FaArrowUp size={12} aria-hidden="true" />
                 : <FaArrowDown size={12} aria-hidden="true" />
                }
            </button>
        </div>
    </div>;
};

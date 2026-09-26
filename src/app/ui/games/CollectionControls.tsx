import { CollectionFilters, FilterPreset } from '@/app/lib/hooks/useCollectionFilters';
import { SortDirection } from '@/app/lib/hooks/useFilterSort';
import { CollectionSearch } from '@/app/ui/games/filters/CollectionSearch';
import { SavedFilterPresets } from '@/app/ui/games/filters/SavedFilterPresets';
import { SortControls, SortFieldOption } from '@/app/ui/games/filters/SortControls';
import { StatusFilterControls } from '@/app/ui/games/filters/StatusFilterControls';
import { CSSProperties, useState } from 'react';
import { FaSave } from 'react-icons/fa';
import { FaFilter, FaXmark } from 'react-icons/fa6';
import './CollectionControls.css';

type CollectionControlsProps<F extends string> = {
    // Sort
    sortFields: SortFieldOption<F>[];
    sortField: F;
    sortDirection: SortDirection;
    onSortClick: (field: F) => void;
    // Status filters
    filters: CollectionFilters;
    setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    // Saved presets
    savedFilters: FilterPreset[];
    onSaveFilters: () => void;
    onLoadFilter: (preset: FilterPreset) => void;
    onRenameFilter: (id: number) => void;
    onDeleteFilter: (id: number) => void;
    onDuplicateFilter: (id: number) => void;
    // Sticky
    stickyTop: number;
};

const STICKY_CLASS = `sticky z-[12] bg-[#f1eff9] dark:bg-green-800 pt-2 pb-2 flex flex-col gap-2`;

const ActiveFilterActions = ({ onReset, onSave }: { onReset: () => void; onSave: () => void }) =>
    <div className="flex grow h-4 justify-end gap-1">
        <button
            type="button"
            className="btn-xs btn-ghost text-base-content/60 cursor-pointer"
            onClick={onReset}
            aria-label="Reset all filters"
            title="Reset filters"
        >
            <FaXmark size={12} aria-hidden="true" />
        </button>
        <button
            type="button"
            className="btn-xs btn-ghost text-base-content/60 cursor-pointer"
            onClick={onSave}
            aria-label="Save filters"
            title="Save filters"
        >
            <FaSave size={12} aria-hidden="true" />
        </button>
    </div>;

export const CollectionControls = <F extends string>(props: CollectionControlsProps<F>) => {
    const {
        sortFields,
        sortField,
        sortDirection,
        onSortClick,
        filters,
        setFilter,
        hasActiveFilters,
        resetFilters,
        savedFilters,
        onSaveFilters,
        onLoadFilter,
        onRenameFilter,
        onDeleteFilter,
        onDuplicateFilter,
        stickyTop,
    } = props;

    const [showFilters, setShowFilters] = useState<boolean>(true);
    const filterToggleLabel = showFilters ? 'Hide filters' : 'Show filters';

    return (
        <div className={STICKY_CLASS} style={{ top: stickyTop } as CSSProperties} id="collection-controls">
            {/* Row 1: unified search (dropdown + input) + filter toggle + sort */}
            <div className="flex gap-1 items-center">
                <CollectionSearch
                    searchMode={filters.searchMode}
                    searchText={filters.searchText}
                    onSearchModeChange={mode => setFilter('searchMode', mode)}
                    onSearchTextChange={text => setFilter('searchText', text)}
                />
                <button
                    type="button"
                    className={`btn relative btn-xs shrink-0 pl-1 pr-1 rounded-sm ${showFilters || hasActiveFilters ? 'btn-primary' : 'text-base-content/40'}`}
                    onClick={() => setShowFilters(v => !v)}
                    aria-label={filterToggleLabel}
                    aria-expanded={showFilters}
                    title={filterToggleLabel}
                    id="show-filters-button"
                >
                    <FaFilter size={11} aria-hidden="true" />
                    {hasActiveFilters && !showFilters && (
                        <div className="absolute -top-0.75 -right-0.75 rounded-full bg-accent w-2 h-2"
                             aria-label="Active filters" />
                    )}
                </button>
                <SortControls
                    sortFields={sortFields}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortClick={onSortClick}
                />
            </div>

            {/* Row 2: status filters */}
            {showFilters && (
                <div className="flex gap-0.5 bg-white dark:bg-black rounded-md p-1.5 items-center overflow-auto"
                     role="group"
                     id="filter-games"
                     aria-label="Filter games">

                    <div className="flex flex-wrap gap-0.5 rounded-md items-center"
                         role="group"
                         aria-label="Collection filters"
                    >
                        <SavedFilterPresets
                            savedFilters={savedFilters}
                            onLoadFilter={onLoadFilter}
                            onRenameFilter={onRenameFilter}
                            onDeleteFilter={onDeleteFilter}
                            onDuplicateFilter={onDuplicateFilter}
                        />
                        <StatusFilterControls filters={filters} setFilter={setFilter} />
                        {hasActiveFilters && <ActiveFilterActions onReset={resetFilters} onSave={onSaveFilters} />}
                    </div>
                </div>
            )}
        </div>
    );
};

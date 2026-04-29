import {    CollectionFilters,
    OwnershipFilter,
    TradeFilter,
    WantFilter,
    ConditionFilter,
    WishlistFilter,
    WishlistPriorityFilter,
    PreorderFilter,
    VerificationFilter,
    ScanFilter,
    cycleThreeState,
} from '@/app/lib/hooks/useCollectionFilters';
import { SortDirection } from '@/app/lib/hooks/useFilterSort';
import { CSSProperties, ReactNode } from 'react';
import {
    FaArrowDown,
    FaArrowUp,
    FaArrowUpWideShort,
    FaBarcode,
    FaCalendar,
    FaCheck,
    FaHeart,
    FaRecycle,
    FaStar,
    FaThumbsUp,
    FaSignal,
    FaXmark,
} from 'react-icons/fa6';

// ── Three-state toggle ────────────────────────────────────────────────────────


type ThreeStateToggleProps<S extends string> = {
    value: S;
    states: readonly [S, S, S]; // [default, on, off]
    onLabel: string;
    offLabel: string;
    icon: ReactNode;
    onChange: (next: S) => void;
    title?: string;
};

const ThreeStateToggle = <S extends string>({
    value,
    states,
    onLabel,
    offLabel,
    icon,
    onChange,
    title,
}: ThreeStateToggleProps<S>) => {
    const isDefault = value === states[0];
    const isOn = value === states[1];
    const isOff = value === states[2];

    const label = isDefault ? (title ?? 'Filter')
        : isOn ? onLabel
        : offLabel;

    const colorClass = isDefault
        ? 'btn-ghost text-base-content/40'
        : isOn
        ? 'btn-success text-success-content'
        : 'btn-error text-error-content';

    return (
        <button
            type="button"
            className={`btn btn-xs gap-1 ${colorClass}`}
            title={label}
            aria-label={label}
            aria-pressed={!isDefault}
            onClick={() => onChange(cycleThreeState(value, states))}
        >
            {isOff ? (
                <span className="relative inline-flex">
                    {icon}
                    <FaXmark
                        size={8}
                        className="absolute -bottom-0.5 -right-1"
                        aria-hidden="true"
                    />
                </span>
            ) : icon}
        </button>
    );
};

// ── Sort controls ─────────────────────────────────────────────────────────────

type SortFieldOption<F extends string> = {
    field: F;
    label: string;
};

type SortControlsInnerProps<F extends string> = {
    sortFields: SortFieldOption<F>[];
    sortField: F;
    sortDirection: SortDirection;
    onSortClick: (field: F) => void;
};

const SortControlsInner = <F extends string>({
    sortFields,
    sortField,
    sortDirection,
    onSortClick,
}: SortControlsInnerProps<F>) => (
    <div className="flex items-center gap-1 shrink-0">
        <select
            className="select select-bordered select-sm rounded-sm w-22 pl-2"
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
            className="btn btn-xs btn-ghost"
            onClick={() => onSortClick(sortField)}
            aria-label={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        >
            {sortDirection === 'asc'
                ? <FaArrowUp size={12} aria-hidden="true" />
                : <FaArrowDown size={12} aria-hidden="true" />
            }
        </button>
    </div>
);

// ── Main CollectionControls ───────────────────────────────────────────────────

type CollectionControlsProps<F extends string> = {
    // Sort
    sortFields: SortFieldOption<F>[];
    sortField: F;
    sortDirection: SortDirection;
    onSortClick: (field: F) => void;
    // Filter text
    filterId: string;
    filterValue: string;
    onFilterChange: (value: string) => void;
    // Status filters
    filters: CollectionFilters;
    setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    // Sticky
    stickyTop: number;
};

const STICKY_CLASS = `sticky z-10 bg-[#f1eff9] dark:bg-yellow-700 pt-2 pb-2 flex flex-col gap-2`;

export const CollectionControls = <F extends string>({
    sortFields,
    sortField,
    sortDirection,
    onSortClick,
    filterId,
    filterValue,
    onFilterChange,
    filters,
    setFilter,
    hasActiveFilters,
    resetFilters,
    stickyTop,
}: CollectionControlsProps<F>) => (
    <div className={STICKY_CLASS} style={{ top: stickyTop } as CSSProperties}>
        {/* Row 1: text filter + sort */}
        <div className="flex gap-2 items-center">
            <label htmlFor={filterId} className="sr-only">Filter by name</label>
            <input
                id={filterId}
                type="search"
                aria-label="Filter by name"
                placeholder="Filter by name…"
                value={filterValue}
                onChange={e => onFilterChange(e.target.value)}
                className="input input-bordered input-sm flex-1 min-w-0"
            />
            <FaArrowUpWideShort size={14} className="shrink-0 text-base-content/50" aria-hidden="true" />
            <SortControlsInner
                sortFields={sortFields}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortClick={onSortClick}
            />
        </div>

        {/* Row 2: status filters */}
        <div className="flex gap-1 items-center overflow-auto" role="group" aria-label="Filter games">

            {/* Ownership dropdown */}
            <div className="flex items-center gap-1 w-24 sm:w-27 xs:w-27">
                <FaCheck size={11} className="text-base-content/40" aria-hidden="true" />
                <select
                    className={`select select-bordered select-xs rounded-sm pl-2 w-24 sm:w-27 xs:w-27${filters.ownership === 'default' ? ' italic' : ''}`}
                    value={filters.ownership}
                    onChange={e => setFilter('ownership', e.target.value as OwnershipFilter)}
                    aria-label="Filter by ownership"
                >
                    <option value="default" className="italic">Ownership</option>
                    <option value="own">Owned</option>
                    <option value="prevowned">Previous</option>
                    <option value="notowned">Not Owned</option>
                </select>
            </div>

            {/* Want dropdown */}
            <div className="flex items-center gap-1 w-30">
                <FaStar size={11} className="text-base-content/40" aria-hidden="true" />
                <select
                    className={`select select-bordered select-xs rounded-sm pl-2 w-30${filters.want === 'default' ? ' italic' : ''}`}
                    value={filters.want}
                    onChange={e => setFilter('want', e.target.value as WantFilter)}
                    aria-label="Filter by want status"
                >
                    <option value="default">Want Status</option>
                    <option value="want">Want in Trade</option>
                    <option value="wanttoplay">Want to Play</option>
                    <option value="wanttobuy">Want to Buy</option>
                </select>
            </div>

            {/* Trade toggle */}
            <ThreeStateToggle
                value={filters.trade}
                states={['default', 'fortrade', 'nottrade'] as const}
                onLabel="For Trade"
                offLabel="Not For Trade"
                icon={<FaRecycle size={12} aria-hidden="true" />}
                onChange={v => setFilter('trade', v as TradeFilter)}
                title="Trade Status"
            />

            {/* Condition toggle */}
            <ThreeStateToggle
                value={filters.condition}
                states={['default', 'has', 'not'] as const}
                onLabel="Has Condition"
                offLabel="No Condition"
                icon={<FaSignal size={12} style={{ transform: 'scaleX(-1)' } as CSSProperties} aria-hidden="true" />}
                onChange={v => setFilter('condition', v as ConditionFilter)}
                title="Condition Status"
            />

            {/* Wishlist toggle */}
            <ThreeStateToggle
                value={filters.wishlist}
                states={['default', 'wishlist', 'notwishlist'] as const}
                onLabel="On Wishlist"
                offLabel="Not on Wishlist"
                icon={<FaHeart size={12} aria-hidden="true" />}
                onChange={v => setFilter('wishlist', v as WishlistFilter)}
                title="Wishlist Status"
            />

            {/* Wishlist Priority — only shown when wishlist filter is active */}
            {filters.wishlist !== 'default' && (
                <select
                    className="pl-2 select select-bordered select-xs w-26 xs:w-28 sm:w-28"
                    value={filters.wishlistPriority}
                    onChange={e => setFilter('wishlistPriority', e.target.value as WishlistPriorityFilter)}
                    aria-label="Filter by wishlist priority"
                >
                    <option value="default">Any Priority</option>
                    <option value="1">Must Have</option>
                    <option value="2">Love to Have</option>
                    <option value="3">Like to Have</option>
                    <option value="4">Considering</option>
                    <option value="5">Don't Buy</option>
                </select>
            )}

            {/* Preorder toggle */}
            <ThreeStateToggle
                value={filters.preorder}
                states={['default', 'preordered', 'notpreordered'] as const}
                onLabel="Preordered"
                offLabel="Not Preordered"
                icon={<FaCalendar size={12} aria-hidden="true" />}
                onChange={v => setFilter('preorder', v as PreorderFilter)}
                title="Preorder Status"
            />

            {/* Verification toggle */}
            <ThreeStateToggle
                value={filters.verification}
                states={['default', 'verified', 'notverified'] as const}
                onLabel="Verified"
                offLabel="Not Verified"
                icon={<FaThumbsUp size={12} aria-hidden="true" />}
                onChange={v => setFilter('verification', v as VerificationFilter)}
                title="Verification Status"
            />

            {/* Scan toggle */}
            <ThreeStateToggle
                value={filters.scan}
                states={['default', 'scanned', 'notscanned'] as const}
                onLabel="Scanned"
                offLabel="Not Scanned"
                icon={<FaBarcode size={12} aria-hidden="true" />}
                onChange={v => setFilter('scan', v as ScanFilter)}
                title="Scan Status"
            />

            {/* Reset */}
            {hasActiveFilters && (
                <button
                    type="button"
                    className="btn btn-xs btn-ghost text-base-content/60"
                    onClick={resetFilters}
                    aria-label="Reset all filters"
                    title="Reset filters"
                >
                    <FaXmark size={12} aria-hidden="true" />
                    Reset
                </button>
            )}
        </div>
    </div>
);


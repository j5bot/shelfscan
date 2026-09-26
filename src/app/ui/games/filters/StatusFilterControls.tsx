import {
    CollectionFilters,
    ConditionFilter,
    OwnershipFilter,
    PlaysFilter,
    PreorderFilter,
    RatingFilter,
    RatingSource,
    ScanFilter,
    TradeFilter,
    VerificationFilter,
    VersionFilter,
    WantFilter,
    WishlistFilter,
    WishlistPriorityFilter,
} from '@/app/lib/hooks/useCollectionFilters';
import { ThreeStateToggle } from '@/app/ui/games/filters/ThreeStateToggle';
import { VersionIcon } from '@/app/ui/icons/VersionIcon';
import { CSSProperties, ReactNode } from 'react';
import {
    FaBarcode,
    FaCalendar,
    FaCheck,
    FaDice,
    FaHeart,
    FaRecycle,
    FaSignal,
    FaStar,
    FaThumbsUp,
    FaUser,
    FaUserGroup,
} from 'react-icons/fa6';
import { SiTarget } from 'react-icons/si';

const BUTTON_BG_CLASS = 'bg-[#efefef] dark:bg-gray-700';
const removeNonDigits = (value: string): string => value.replace(/\D/g, '');

export type FilterControlProps = {
    filters: CollectionFilters;
    setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
};

/** A toggle that, once active, expands into a group with extra inputs. */
const ExpandedFilterGroup = ({ id, className, children }: { id: string; className?: string; children: ReactNode }) =>
    <div id={id} className={className ?? `flex w-fit ${BUTTON_BG_CLASS} p-0.5 rounded-sm items-center gap-0.5`}>
        {children}
    </div>;

const OwnershipFilterControl = ({ filters, setFilter }: FilterControlProps) => {
    const toggle = <ThreeStateToggle
        id="ownership-toggle"
        value={filters.ownership}
        states={['default', 'own', 'notowned'] as const}
        onLabel="Owned"
        offLabel="Not Owned"
        icon={<FaCheck size={12} aria-hidden="true" />}
        onChange={v => setFilter('ownership', v as OwnershipFilter)}
        title="Ownership Status"
    />;

    if (filters.ownership === 'default') {
        return toggle;
    }
    return <ExpandedFilterGroup id="ownership-controls">
        {toggle}
        <select
            className="pl-2 select rounded-sm select-bordered select-xs w-26 xs:w-28 sm:w-28 shrink-0"
            value={filters.ownership}
            onChange={e => setFilter('ownership', e.target.value as OwnershipFilter)}
            aria-label="Filter by ownership"
        >
            <option value="own">Owned</option>
            <option value="prevowned">Previous</option>
            <option value="notowned">Not Owned</option>
        </select>
    </ExpandedFilterGroup>;
};

const WantFilterControl = ({ filters, setFilter }: FilterControlProps) => {
    const isActive = filters.want !== 'default';
    const toggle = <button
        id="want-toggle"
        type="button"
        className={`btn btn-condensed btn-xs ${
            isActive ? 'btn-success text-success-content' : `text-base-content/40 ${BUTTON_BG_CLASS}`
        } rounded-sm gap-0.5`}
        onClick={() => setFilter('want', isActive ? 'default' : 'want')}
        aria-label="Change want filter"
        title="Want Status"
    >
        <SiTarget size={12} aria-hidden="true" />
    </button>;

    if (!isActive) {
        return toggle;
    }
    return <ExpandedFilterGroup id="want-controls">
        {toggle}
        <select
            className="pl-2 select rounded-sm select-bordered select-xs w-28 shrink-0"
            value={filters.want}
            onChange={e => setFilter('want', e.target.value as WantFilter)}
            aria-label="Filter by want status"
        >
            <option value="want">Want in Trade</option>
            <option value="wanttoplay">Want to Play</option>
            <option value="wanttobuy">Want to Buy</option>
        </select>
    </ExpandedFilterGroup>;
};

const RatingFilterControl = ({ filters, setFilter }: FilterControlProps) => {
    const toggle = <ThreeStateToggle
        id="rating-toggle"
        value={filters.rating}
        states={['default', 'rated', 'notrated'] as const}
        onLabel="Rated"
        offLabel="Not Rated"
        icon={<FaStar size={12} aria-hidden="true" />}
        onChange={v => setFilter('rating', v as RatingFilter)}
        title="Rating Filter"
    />;

    if (filters.rating !== 'rated') {
        return toggle;
    }
    const isUserRating = filters.ratingSource === 'user';
    return <ExpandedFilterGroup id="rating-controls">
        {toggle}
        <button
            type="button"
            className="btn btn-condensed btn-xs btn-primary rounded-sm gap-0.5"
            onClick={() => setFilter('ratingSource', isUserRating ? 'average' : 'user' as RatingSource)}
            aria-label={isUserRating ? 'Filter by user rating' : 'Filter by average rating'}
            title={isUserRating ? 'User Rating' : 'Average Rating'}
        >
            {isUserRating
             ? <FaUser size={12} aria-hidden="true" />
             : <FaUserGroup size={12} aria-hidden="true" />
            }
        </button>
        <input
            type="text"
            inputMode="decimal"
            className="input input-bordered input-xs w-14 rounded-sm"
            placeholder="Min"
            value={filters.ratingMin}
            onChange={e => setFilter('ratingMin', e.target.value)}
            aria-label="Minimum rating"
        />
        <span className="text-xs text-base-content/50">–</span>
        <input
            type="text"
            inputMode="decimal"
            className="input input-bordered input-xs w-14 rounded-sm"
            placeholder="Max"
            value={filters.ratingMax}
            onChange={e => setFilter('ratingMax', e.target.value)}
            aria-label="Maximum rating"
        />
    </ExpandedFilterGroup>;
};

const PlaysFilterControl = ({ filters, setFilter }: FilterControlProps) => {
    const toggle = <ThreeStateToggle
        id="plays-toggle"
        value={filters.plays}
        states={['default', 'played', 'notplayed'] as const}
        onLabel="Played"
        offLabel="Not Played"
        icon={<FaDice size={12} aria-hidden="true" />}
        onChange={v => setFilter('plays', v as PlaysFilter)}
        title="Plays Filter"
    />;

    if (filters.plays !== 'played') {
        return toggle;
    }
    return <ExpandedFilterGroup id="plays-controls">
        {toggle}
        <input
            type="text"
            inputMode="numeric"
            className="input input-bordered input-xs w-10 px-1.5 rounded-sm"
            placeholder="Min"
            value={filters.playsMin}
            onChange={e => setFilter('playsMin', removeNonDigits(e.target.value))}
            aria-label="Minimum plays"
        />
        <span className="text-xs text-base-content/50">–</span>
        <input
            type="text"
            inputMode="numeric"
            className="input input-bordered input-xs w-11 px-1.5 rounded-sm"
            placeholder="Max"
            value={filters.playsMax}
            onChange={e => setFilter('playsMax', removeNonDigits(e.target.value))}
            aria-label="Maximum plays"
        />
    </ExpandedFilterGroup>;
};

const WishlistFilterControl = ({ filters, setFilter }: FilterControlProps) => {
    const isActive = filters.wishlist !== 'default';
    const toggle = <ThreeStateToggle
        id={isActive ? undefined : 'wishlist-toggle'}
        value={filters.wishlist}
        states={['default', 'wishlist', 'notwishlist'] as const}
        onLabel="On Wishlist"
        offLabel="Not on Wishlist"
        icon={<FaHeart size={12} aria-hidden="true" />}
        onChange={v => setFilter('wishlist', v as WishlistFilter)}
        title="Wishlist Status"
    />;

    if (!isActive) {
        return toggle;
    }
    return <ExpandedFilterGroup id="wishlist-controls" className="flex bg-[#efefef] p-0.5 rounded-sm items-center gap-0.5">
        {toggle}
        <select
            className="pl-2 select rounded-sm select-bordered select-xs w-26 xs:w-28 sm:w-28 shrink-0"
            value={filters.wishlistPriority}
            onChange={e => setFilter('wishlistPriority', e.target.value as WishlistPriorityFilter)}
            aria-label="Filter by wishlist priority"
        >
            <option value="default">Any Priority</option>
            <option value="1">Must Have</option>
            <option value="2">Love to Have</option>
            <option value="3">Like to Have</option>
            <option value="4">Considering</option>
            <option value="5">Don&apos;t Buy</option>
        </select>
    </ExpandedFilterGroup>;
};

type SimpleToggleKey = 'trade' | 'condition' | 'preorder' | 'version' | 'verification' | 'scan';

type SimpleToggleConfig = {
    key: SimpleToggleKey;
    id: string;
    states: readonly [string, string, string];
    onLabel: string;
    offLabel: string;
    icon: ReactNode;
    title: string;
};

const SimpleToggles: Record<SimpleToggleKey, SimpleToggleConfig> = {
    trade: {
        key: 'trade', id: 'trade-control', states: ['default', 'fortrade', 'nottrade'],
        onLabel: 'For Trade', offLabel: 'Not For Trade', title: 'Trade Status',
        icon: <FaRecycle size={12} aria-hidden="true" />,
    },
    condition: {
        key: 'condition', id: 'condition-control', states: ['default', 'has', 'not'],
        onLabel: 'Has Condition', offLabel: 'No Condition', title: 'Condition Status',
        icon: <FaSignal size={12} style={{ transform: 'scaleX(-1)' } as CSSProperties} aria-hidden="true" />,
    },
    preorder: {
        key: 'preorder', id: 'preorder-toggle', states: ['default', 'preordered', 'notpreordered'],
        onLabel: 'Preordered', offLabel: 'Not Preordered', title: 'Preorder Status',
        icon: <FaCalendar size={12} aria-hidden="true" />,
    },
    version: {
        key: 'version', id: 'version-toggle', states: ['default', 'versioned', 'notversioned'],
        onLabel: 'Versioned', offLabel: 'Not Versioned', title: 'Versioned Status',
        icon: <VersionIcon height={12} aria-hidden="true" />,
    },
    verification: {
        key: 'verification', id: 'verification-toggle', states: ['default', 'verified', 'notverified'],
        onLabel: 'Verified', offLabel: 'Not Verified', title: 'Verification Status',
        icon: <FaThumbsUp size={12} aria-hidden="true" />,
    },
    scan: {
        key: 'scan', id: 'scan-toggle', states: ['default', 'scanned', 'notscanned'],
        onLabel: 'Scanned', offLabel: 'Not Scanned', title: 'Scan Status',
        icon: <FaBarcode size={12} aria-hidden="true" />,
    },
};

type SimpleToggleValue = TradeFilter | ConditionFilter | PreorderFilter | VersionFilter | VerificationFilter | ScanFilter;

const SimpleFilterToggle = ({ config, filters, setFilter }: FilterControlProps & { config: SimpleToggleConfig }) =>
    <ThreeStateToggle
        id={config.id}
        value={filters[config.key] as string}
        states={config.states}
        onLabel={config.onLabel}
        offLabel={config.offLabel}
        icon={config.icon}
        onChange={v => setFilter(config.key, v as SimpleToggleValue)}
        title={config.title}
    />;

/** The status filter row's controls, in display order. */
export const StatusFilterControls = (props: FilterControlProps) => <>
    <OwnershipFilterControl {...props} />
    <WantFilterControl {...props} />
    <RatingFilterControl {...props} />
    <PlaysFilterControl {...props} />
    <SimpleFilterToggle config={SimpleToggles.trade} {...props} />
    <SimpleFilterToggle config={SimpleToggles.condition} {...props} />
    <WishlistFilterControl {...props} />
    <SimpleFilterToggle config={SimpleToggles.preorder} {...props} />
    <SimpleFilterToggle config={SimpleToggles.version} {...props} />
    <SimpleFilterToggle config={SimpleToggles.verification} {...props} />
    <SimpleFilterToggle config={SimpleToggles.scan} {...props} />
</>;

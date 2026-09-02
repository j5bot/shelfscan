import { VersionIcon } from '@/app/ui/icons/VersionIcon';
import { useCollection, useUsername } from '@/app/ui/tours/hooks';
import { pointer } from '@/app/ui/tours/stepConfig';
import { Tour, TourStep } from '@/app/lib/types/tour';
import { FaSearch } from 'react-icons/fa';
import {
    FaBarcode,
    FaCalendar,
    FaCheck,
    FaCloudArrowDown,
    FaDice,
    FaFilter, FaHeart, FaRecycle, FaSignal,
    FaSort,
    FaStar, FaThumbsUp,
    FaUser
} from 'react-icons/fa6';
import { SiTarget } from 'react-icons/si';

const usernameStep: TourStep = params => {
    const { nextStep } = params;
    useUsername(nextStep);

    return {
        icon: <FaUser className="h-5 w-5" />,
        title: 'BoardGameGeek User',
        content: `Enter your BGG username to integrate your collection info with ShelfScan.  If you
            don't have a BGG account, just enter 'ShelfScan'`,
        selector: '#bgg-username',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        ...pointer,
    };
};
Object.assign(usernameStep, {
    selector: '#bgg-username',
    side: 'bottom-left',
});

const collectionStep: TourStep = params => {
    const { nextStep } = params;
    useCollection(nextStep);

    return {
        icon: <FaCloudArrowDown className="h-5 w-5" />,
        title: 'BGG Collection',
        content: `Click 'Get Collection' to get BGG collection info`,
        selector: '.get-collection-section',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    };
};
Object.assign(collectionStep, {
    selector: '.get-collection-section',
    side: 'bottom',
});

const steps: TourStep[] = [
    // usernameStep,
    // collectionStep,
    {
        icon: <FaFilter className="h-5 w-5" />,
        title: 'Search & Filter Games',
        content: (<div>
            <p>Search and filter games by various statuses and properties.</p>
            <ul className="list mt-2">
                <li className="flex items-center gap-2"><FaCheck className="h-4 w-4" /> Ownership Status</li>
                <li className="flex items-center gap-2"><SiTarget className="h-4 w-4" /> Want Type</li>
                <li className="flex items-center gap-2"><FaStar className="h-4 w-4" /> Rating</li>
                <li className="flex items-center gap-2"><FaDice className="h-4 w-4" /> Plays</li>
                <li className="flex items-center gap-2"><FaRecycle className="h-4 w-4" /> Trade Status</li>
                <li className="flex items-center gap-2"><FaSignal className="h-4 w-4" /> Condition Present</li>
                <li className="flex items-center gap-2"><FaHeart className="h-4 w-4" /> Wishlist Status</li>
            </ul>
        </div>),
        selector: '#collection-controls',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaFilter className="h-5 w-5" />,
        title: 'Search & Filter Games (More)',
        content: (<div>
            <p>Search and filter games by more statuses and properties.</p>
            <ul className="list mt-2">
                <li className="flex items-center gap-2"><FaCalendar className="h-4 w-4" /> Preordered</li>
                <li className="flex items-center gap-2"><VersionIcon height={10} /> Version Present</li>
                <li className="flex items-center gap-2"><FaThumbsUp className="h-4 w-4" /> GameUPC Verified</li>
                <li className="flex items-center gap-2"><FaBarcode className="h-4 w-4" /> Scanned</li>
            </ul>
        </div>),
        selector: '#collection-controls',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaSearch className="h-5 w-5" />,
        title: 'Search by Name, Tag, Version',
        content: `Use this bar to search for games by name, tag, and version`,
        selector: '#search-filters',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaFilter className="h-5 w-5" />,
        title: 'Advanced Filters',
        content: `Show or hide advanced filters`,
        selector: '#show-filters-button',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaSort className="h-5 w-5" />,
        title: 'Sort Games',
        content: `Sort games however you want them`,
        selector: '#sort-controls',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
];

export const collectionFilteringTour: Tour = {
    tour: 'collectionFiltering',
    steps,
};

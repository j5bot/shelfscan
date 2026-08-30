import { GameDetailsStep } from '@/app/lib/tours/index';
import { pointer } from '@/app/lib/tours/stepConfig';
import { Tour, TourStep } from '@/app/lib/types/tour';
import { TourCardProps } from '@/app/ui/tour/TourCard';
import Image from 'next/image';
import { Step } from 'nextstepjs';
import { FaBarcode, FaCloudArrowDown, FaList, FaUser } from 'react-icons/fa6';

const generateListStep = (params: TourCardProps): Step => {
    return {
        icon: <FaList className="h-5 w-5" />,
        title: 'Game Details',
        content: <GameDetailsStep {...params} />,
        selector: '#scanlist',
        side: 'top',
        showControls: true,
        ...pointer,
    };
};

const steps: TourStep[] = [
    {
        icon: <Image
            priority={true}
            src={'/wordmark.svg'}
            alt="ShelfScan"
            width={200} height={64}
        />,
        title: '',
        content: `Welcome to ShelfScan,
an application for managing BGG collections, scanning board game UPCs, and more`,
        selector: '#shelfscan-logo',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaUser className="h-5 w-5" />,
        title: 'BoardGameGeek User',
        content: `Enter your BGG username to integrate your collection info with ShelfScan.  If you
        don't have a BGG account, just enter 'ShelfScan'`,
        selector: '#bgg-username',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaCloudArrowDown className="h-5 w-5" />,
        title: 'BGG Collection',
        content: `Click 'Get Collection' to get BGG collection info`,
        selector: '.get-collection-section',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaBarcode className="h-5 w-5" />,
        title: 'Scan Barcodes',
        content: `Use your camera to scan board game barcodes`,
        selector: '#scan-barcodes',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
        pointerRadius: 12,
    },
    generateListStep,
];

export const scannerTour: Tour = {
    tour: 'scanner',
    steps,
};

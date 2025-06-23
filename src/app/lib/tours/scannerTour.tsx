import { pointer } from '@/app/lib/tours/stepConfig';
import { Step } from 'nextstepjs';
import { FaBarcode, FaCloudArrowDown, FaUser } from 'react-icons/fa6';

const steps: Step[] = [
    {
        icon: '',
        title: 'ShelfScan',
        content: `Welcome to ShelfScan,
an application for scanning board game UPCs`,
        selector: '#shelfscan-logo',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaUser className="h-5 w-5" />,
        title: 'BoardGameGeek User',
        content: 'Enter your BGG username to integrate your collection info with ShelfScan',
        selector: '#bgg-username',
        side: 'bottom-left',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaCloudArrowDown className="h-5 w-5" />,
        title: 'BGG Collection',
        content: `Click 'Get Collection' to get BGG collection info.
        Uncheck 'Use Cache' to get a fresh copy`,
        selector: '#bgg-get-collection',
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
];

export const scannerTour = {
    tour: 'scanner',
    steps,
};

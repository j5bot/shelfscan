import { useCodes } from '@/app/lib/CodesProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { pointer } from '@/app/lib/tours/stepConfig';
import { Tour, TourStep } from '@/app/lib/types/tour';
import { TourCardProps } from '@/app/ui/tour/TourCard';
import Image from 'next/image';
import Link from 'next/link';
import { Step, useNextStep } from 'nextstepjs';
import React, { useEffect } from 'react';
import { FaBarcode, FaCloudArrowDown, FaList, FaUser } from 'react-icons/fa6';

const testUPC = '222222222222';

const PresentList = (props: TourCardProps) => {
    const { skipTour } = props;

    const { startNextStep, closeNextStep } = useNextStep();
    const { codes, setCodes } = useCodes();
    const {
        getGameData,
    } = useGameUPCData();

    useEffect(() => {
        getGameData(testUPC).then();
        if (!codes.includes(testUPC)) {
            setCodes([...codes, testUPC]);
        }
    }, []);

    return <div className="flex flex-col gap-2">
        <div>
            Click on an item in the scanned game list to view details and take
            more actions.
        </div>
        <Link
            href={`/upc/${testUPC}`}
            className="btn"
            onClick={() => {
                skipTour?.();
                closeNextStep();
                setTimeout(() => {
                    startNextStep('gamePage');
                }, 1000);
            }}
        >Go to Select Version Tour</Link>
    </div>;
};

const generateListStep = (params: TourCardProps): Step => {
    return {
        icon: <FaList className="h-5 w-5" />,
            title: 'Select Version',
        content: <PresentList {...params} />,
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
        content: `Click 'Get Collection' to get BGG collection info.
        Uncheck 'Use Cache' to get a fresh copy.  Check 'Remember Me' to stay
        logged in.`,
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

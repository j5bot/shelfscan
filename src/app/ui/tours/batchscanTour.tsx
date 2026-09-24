import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useInfoCollectionStatus } from '@/app/lib/hooks/useInfoCollectionStatus';
import { testUPCs } from '@/app/ui/tours/consts';
import { pointer } from '@/app/ui/tours/stepConfig';
import { CollectionStepContent, UsernameStepContent } from '@/app/ui/tours/StepContent';
import { Tour, TourStep } from '@/app/lib/types/tour';
import { useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FaBarcode, FaCloudArrowDown, FaPlus, FaUser } from 'react-icons/fa6';

type BatchStepContentProps = {
    start: number;
    end: number;
};

const BatchStepContent = (props: BatchStepContentProps) => {
    const { start, end } = props;
    const { codes, setCodes } = useInfoCollectionStatus();

    const {
        getGameData,
    } = useGameUPCData();

    useEffect(() => {
        const existingCodes = new Set(codes);
        const loadUPCs = testUPCs.slice(start, end)
            .filter(code => !existingCodes.has(code));
        Promise.all(loadUPCs.map(upc => getGameData(upc))).then();
        setCodes(prev => Array.from(new Set([...prev, ...loadUPCs])));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start, end]);

    return <>Scan {start > 0 ? 'more ' : ''}games</>;
};

const generateBatchScanStep = (start: number, end: number): TourStep => {
    const batchScanStep: TourStep = () => {
        return {
            icon: <FaBarcode className="h-5 w-5" />,
            title: `Scan ${start > 0 ? 'More ' : ''}Games`,
            content: <BatchStepContent start={start} end={end} />,
            showControls: true,
            showSkip: true,
            ...pointer,
            pointerRadius: 12,
        };
    };
    return Object.assign(batchScanStep, {
        selector: '#scan-barcodes',
        side: start > 1 ? undefined : 'bottom' as 'bottom',
    });
};

const bsStep1 = generateBatchScanStep(0, 1);
const bsStep2 = generateBatchScanStep(1, 3);

const steps: TourStep[] = [
    params => {
        const { nextStep } = params;

        return {
            icon: <FaUser className="h-5 w-5" />,
            title: 'BoardGameGeek User',
            content: <UsernameStepContent nextStep={nextStep} />,
            selector: '#bgg-username',
            side: 'bottom-left',
            showControls: true,
            showSkip: true,
            ...pointer,
        };
    },
    params => {
        const { nextStep } = params;

        return {
            icon: <FaCloudArrowDown className="h-5 w-5" />,
            title: 'BGG Collection',
            content: <CollectionStepContent nextStep={nextStep} />,
            selector: '.get-collection-section',
            side: 'bottom',
            showControls: true,
            showSkip: true,
            ...pointer,
        };
    },
    bsStep1,
    bsStep2,
    {
        icon: <FaPlus className="h-5 w-5" />,
        title: 'Add to Collection',
        content: `Click 'Add 2 Games to Collection' to test adding games to
            your collection`,
        selector: '#batch-add-button',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaExclamationTriangle className="h-5 w-5" />,
        title: 'Added Games Notice',
        content: `A notification about added games appears`,
        selector: '#batch-add-toast',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
];

export const batchscanTour: Tour = {
    tour: 'batchscan',
    steps,
};

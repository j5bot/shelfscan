import { useCodes } from '@/app/lib/CodesProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { scannerTour } from '@/app/lib/tours/scannerTour';
import { gamePageTour } from '@/app/lib/tours/gamePageTour';
import { Tour } from '@/app/lib/types/tour';
import { TourCardProps } from '@/app/ui/tour/TourCard';
import Link from 'next/link';
import { useNextStep } from 'nextstepjs';
import React, { useEffect } from 'react';

export const testUPC = '222222222222';

export const GameDetailsStep = (props: TourCardProps) => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        >Go to Game Details Tour</Link>
    </div>;
};

const getTourInfo = (tourName: string = 'default') => {
    const info = window?.localStorage.getItem(`tours-${tourName}`);
    return info ? JSON.parse(info) : {};
};

const setTourInfo = (tourName: string = 'default', info: unknown) => {
    window?.localStorage.setItem(`tours-${tourName}`, JSON.stringify(info));
};

export const onStart = (tourName?: string | null) => {
    const info = getTourInfo(tourName ?? undefined);
    info.started = true;
    setTourInfo(tourName ?? undefined, info);
};

export const onStepChange = (step: number, tourName: string | null) => {
    const info = getTourInfo(tourName ?? undefined);
    info.step = step;
    setTourInfo(tourName ?? undefined, info);
};

export const onComplete = (tourName: string | null) => {
    const info = getTourInfo(tourName ?? undefined);
    info.completed = true;
    setTourInfo(tourName ?? undefined, info);
};

export const onSkip = (step: number, tourName: string | null) => {
    const info = getTourInfo(tourName ?? undefined);
    info.step = step;
    info.skipped = true;
    setTourInfo(tourName ?? undefined, info);
};

export const hasSeenTour = (tourName: string) => {
    const info = getTourInfo(tourName);
    return info.completed || info.skipped;
};

export const tours: Tour[] = [
    scannerTour,
    gamePageTour,
];

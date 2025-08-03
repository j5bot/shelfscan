import { scannerTour } from '@/app/lib/tours/scannerTour';
import { gamePageTour } from '@/app/lib/tours/gamePageTour';
import { Tour } from '@/app/lib/types/tour';

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

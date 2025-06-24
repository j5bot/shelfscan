import { pointer } from '@/app/lib/tours/stepConfig';
import { Step } from 'nextstepjs';

const steps: Step[] = [
    {
        icon: '',
        title: 'Game Details',
        content: 'Basic details about the game you scanned',
        selector: '#game-details',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: '',
        title: 'Select Matching Game',
        content: `Select the matching game from the list`,
        selector: '#select-game',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: '',
        title: 'Select Matching Version',
        content: `Select the matching version from the list.
        Scroll right to see all choices.  Go ahead and choose a version now`,
        selector: '#select-version',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    }
];

export const selectVersionTour = {
    tour: 'selectVersion',
    steps,
};

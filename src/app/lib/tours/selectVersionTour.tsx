import { pointer } from '@/app/lib/tours/stepConfig';
import { Tour, TourStep } from '@/app/lib/types/tour';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import Image from 'next/image';
import React from 'react';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

const steps: TourStep[] = [
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
        icon: <Image
            className="inline-block w-6 h-6 md:w-8 md:h-8"
            src={'/icons/box-game.png'} alt="Game" width={32} height={32}
        />,
        title: 'Game Symbol',
        content: `This is ShelfScan's game symbol, differentiating game selection from version selection`,
        selector: '#game-symbol',
        side: 'right',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <SvgCssGauge className="confidence-level shrink-0 m-0.5"
                           color={'lightgreen'}
                           fill={'lightgreen'}
                           value={96} />,
        title: 'Confidence Level',
        content: `These are confidence level gauges.  The fuller the ring is, the higher confidence we have
        that we know the correct matching game or version`,
        selector: '.confidence-level',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <Image
            className="inline-block w-6 h-6 md:w-8 md:h-8"
            src={'/icons/box-game.png'} alt="Game" width={32} height={32}
        />,
        title: 'Select Matching Game',
        content: `Select the matching game from the list`,
        selector: '#select-game',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon:  <Image
            className="inline-block w-6 h-6 md:w-8 md:h-8"
            src={'/icons/box-version.png'}
            alt="Version" width={32} height={32}
        />,
        title: 'Version Symbol',
        content: `This is ShelfScan's version symbol, differentiating version selection from game selection`,
        selector: '#version-symbol',
        side: 'right',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <Image
            className="inline-block w-6 h-6 md:w-8 md:h-8"
            src={'/icons/box-version.png'}
            alt="Version" width={32} height={32}
        />,
        title: 'Select Matching Version',
        content: `Select the matching version from the list.
        Scroll right to see all choices.  Go ahead and choose a version now`,
        selector: '#select-version',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaThumbsUp />,
        title: 'Update GameUPC',
        content: `Once you're sure you have the right game and version, click this button to update
        the GameUPC database. Click it now.  The confidence level will go up`,
        selector: '.update-button',
        side: 'top-right',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaThumbsDown />,
        title: 'Undo Update',
        content: `If you're concerned that you made a mistake, click the 'thumbs down' button to ask
        GameUPC to undo the update.  Click it now`,
        selector: '.remove-button:nth-of-type(2)',
        side: 'top-right',
        showControls: true,
        showSkip: true,
        ...pointer,
    }
];

export const selectVersionTour: Tour = {
    tour: 'selectVersion',
    steps,
};

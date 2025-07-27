import { pointer } from '@/app/lib/tours/stepConfig';
import { Tour, TourStep } from '@/app/lib/types/tour';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import Image from 'next/image';
import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaBarcode, FaCheck, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

const steps: TourStep[] = [
    {
        icon: '',
        title: 'Game Details',
        content: 'Basic details about the game you scanned will appear here',
        selector: '#game-details',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaSearch />,
        title: 'Search Game',
        content: `Use this search box to find a different game or when there are no
            results.  Click the triangle button to execute the search.`,
        selector: '#search-game-form',
        side: 'bottom',
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
        side: 'right',
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
        content: `Select the matching game from the list. Choose a game now`,
        selector: '#select-game',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: <FaCheck />,
        title: 'In Collection',
        content: `A checkmark appears next to the game's name if it is already in your collection`,
        selector: '#select-game',
        side: 'top',
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
        icon: <FaCheck />,
        title: 'Version In Collection',
        content: `A checkmark appears next to the version's name if it is already in your collection`,
        selector: '#select-version',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    },
    {
        icon: '',
        title: 'Game Details',
        content: `You'll now see more details and the correct image for the selected version here`,
        selector: '#game-details',
        side: 'bottom',
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
    },
    {
        icon: <FaBarcode />,
        title: 'Scan More',
        content: `Click on the 'Scan' button to scan more games`,
        selector: '.scan-button',
        side: 'top',
        showControls: true,
        showSkip: true,
        ...pointer,
    }
];

export const selectVersionTour: Tour = {
    tour: 'selectVersion',
    steps,
};

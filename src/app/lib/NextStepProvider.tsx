import { useTailwindDarkMode } from '@/app/lib/TailwindProvider';
import { onComplete, onSkip, onStart, onStepChange, tours } from '@/app/lib/tours';
import { TourCard } from '@/app/ui/tour/TourCard';
import { NextStep, NextStepProvider as Provider, Tour } from 'nextstepjs';
import { ReactNode } from 'react';

type Props = {
    children: ReactNode;
};

export const NextStepProvider = ({ children }: Props) => {
    const darkMode = useTailwindDarkMode();

    return <Provider>
        <NextStep steps={(tours as unknown) as Tour[]}
                  onStart={onStart}
                  onStepChange={onStepChange}
                  onComplete={onComplete}
                  onSkip={onSkip}
                  cardComponent={TourCard}
                  shadowRgb={darkMode ? '255, 255, 255' : '0, 0, 0'}
        >
            {children}
        </NextStep>
    </Provider>;
};

'use client';

import { CodesProvider } from '@/app/lib/CodesProvider';
import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { TailwindBreakpointProvider } from '@/app/lib/TailwindBreakpointProvider';
import { onComplete, onSkip, onStart, onStepChange, tours } from '@/app/lib/tours';
import { Provider } from '@/app/Provider';
import { TourCard } from '@/app/ui/tour/TourCard';
import { NextStep, NextStepProvider, Tour } from 'nextstepjs';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <TailwindBreakpointProvider>
            <CodesProvider>
                <GameSelectionsProvider>
                    <GameUPCDataProvider>
                        <NextStepProvider>
                            <NextStep steps={(tours as unknown) as Tour[]}
                                onStart={onStart}
                                onStepChange={onStepChange}
                                onComplete={onComplete}
                                onSkip={onSkip}
                                cardComponent={TourCard}
                            >
                                {children}
                            </NextStep>
                        </NextStepProvider>
                    </GameUPCDataProvider>
                </GameSelectionsProvider>
            </CodesProvider>
        </TailwindBreakpointProvider>
    </Provider>;
};

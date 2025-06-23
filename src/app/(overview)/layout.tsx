'use client';

import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { TailwindBreakpointProvider } from '@/app/lib/TailwindBreakpointProvider';
import { onComplete, onSkip, onStart, onStepChange, tours } from '@/app/lib/tours';
import { Provider } from '@/app/Provider';
import { NextStep, NextStepProvider } from 'nextstepjs';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <TailwindBreakpointProvider>
            <GameSelectionsProvider>
                <GameUPCDataProvider>
                    <NextStepProvider>
                        <NextStep steps={tours}
                            onStart={onStart}
                            onStepChange={onStepChange}
                            onComplete={onComplete}
                            onSkip={onSkip}
                        >
                            {children}
                        </NextStep>
                    </NextStepProvider>
                </GameUPCDataProvider>
            </GameSelectionsProvider>
        </TailwindBreakpointProvider>
    </Provider>;
};

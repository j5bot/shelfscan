'use client';

import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { TailwindBreakpointProvider } from '@/app/lib/TailwindBreakpointProvider';
import { Provider } from '@/app/Provider';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <TailwindBreakpointProvider>
            <GameSelectionsProvider>
                <GameUPCDataProvider>
                    {children}
                </GameUPCDataProvider>
            </GameSelectionsProvider>
        </TailwindBreakpointProvider>
    </Provider>;
};

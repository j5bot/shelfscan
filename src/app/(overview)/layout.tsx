'use client';

import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { TailwindBreakpointProvider } from '@/app/lib/TailwindBreakpointProvider';
import { Provider } from '@/app/Provider';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <TailwindBreakpointProvider>
            <GameUPCDataProvider>
                {children}
            </GameUPCDataProvider>
        </TailwindBreakpointProvider>
    </Provider>;
};

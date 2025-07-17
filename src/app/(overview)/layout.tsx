'use client';

import { CodesProvider } from '@/app/lib/CodesProvider';
import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { NextStepProvider } from '@/app/lib/NextStepProvider';
import { PluginMapProvider } from '@/app/lib/PluginMapProvider';
import { TailwindProvider } from '@/app/lib/TailwindProvider';
import { Provider } from '@/app/Provider';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <TailwindProvider>
            <PluginMapProvider>
                <CodesProvider>
                    <GameSelectionsProvider>
                        <GameUPCDataProvider>
                            <NextStepProvider>
                                {children}
                            </NextStepProvider>
                        </GameUPCDataProvider>
                    </GameSelectionsProvider>
                </CodesProvider>
            </PluginMapProvider>
        </TailwindProvider>
    </Provider>;
};

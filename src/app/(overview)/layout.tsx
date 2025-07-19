'use client';

import { CodesProvider } from '@/app/lib/CodesProvider';
import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { NextStepProvider } from '@/app/lib/NextStepProvider';
import { PluginMapProvider } from '@/app/lib/PluginMapProvider';
import { SettingsProvider } from '@/app/lib/SettingsProvider';
import { TailwindProvider } from '@/app/lib/TailwindProvider';
import { Provider } from '@/app/Provider';
import { PoweredByBGGLogo } from '@/app/ui/PoweredByBGGLogo';
import Link from 'next/link';
import React, { type CSSProperties, ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <SettingsProvider>
            <TailwindProvider>
                <PluginMapProvider>
                    <CodesProvider>
                        <GameSelectionsProvider>
                            <GameUPCDataProvider>
                                <NextStepProvider>
                                    <div style={{
                                        minHeight: 'calc(100dvh - 10em)'
                                    }}>
                                        {children}
                                    </div>
                                    <div className="h-[10em]">
                                        <div className="absolute bottom-4 flex gap-8 justify-center items-center w-full">
                                            <Link href={'https://boardgamegeek.com'} target="_blank">
                                                <PoweredByBGGLogo
                                                    width={114}
                                                    height={25}
                                                    style={{
                                                        '--bgg-head-fill': 'currentColor',
                                                        '--bgg-text-fill': 'currentColor',
                                                    } as CSSProperties}
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </NextStepProvider>
                            </GameUPCDataProvider>
                        </GameSelectionsProvider>
                    </CodesProvider>
                </PluginMapProvider>
            </TailwindProvider>
        </SettingsProvider>
    </Provider>;
};

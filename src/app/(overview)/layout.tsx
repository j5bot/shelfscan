'use client';

import { CodesProvider } from '@/app/lib/CodesProvider';
import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { ExtensionResponse } from '@/app/lib/extension/useExtension';
import { NextStepProvider } from '@/app/lib/NextStepProvider';
import { PluginMapProvider } from '@/app/lib/PluginMapProvider';
import { SettingsProvider } from '@/app/lib/SettingsProvider';
import { TailwindProvider } from '@/app/lib/TailwindProvider';
import { Provider } from '@/app/Provider';
import { GetExtensionLink } from '@/app/ui/GetExtensionLink';
import { PoweredByBGGLogo } from '@/app/ui/PoweredByBGGLogo';
import Link from 'next/link';
import React, { type CSSProperties, ReactNode, Suspense } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Provider>
        <SettingsProvider>
            <TailwindProvider>
                <PluginMapProvider>
                    <CodesProvider>
                        <GameSelectionsProvider>
                            <GameUPCDataProvider>
                                <NextStepProvider>
                                    <Suspense><ExtensionResponse /></Suspense>
                                    <div style={{
                                        minHeight: 'calc(100dvh - 7.5em)'
                                    }}>
                                        {children}
                                    </div>
                                    <div className="h-[7.5em] flex flex-col justify-end">
                                        <Suspense><GetExtensionLink /></Suspense>
                                        <div className="flex pb-2 justify-center items-center w-full">
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

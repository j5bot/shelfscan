'use client';

import { CodesProvider } from '@/app/lib/CodesProvider';
import { GameSelectionsProvider } from '@/app/lib/GameSelectionsProvider';
import { GameUPCDataProvider } from '@/app/lib/GameUPCDataProvider';
import { useExtension } from '@/app/lib/hooks/useExtension';
import { NextStepProvider } from '@/app/lib/NextStepProvider';
import { PluginMapProvider } from '@/app/lib/PluginMapProvider';
import { SettingsProvider } from '@/app/lib/SettingsProvider';
import { TailwindProvider } from '@/app/lib/TailwindProvider';
import { Provider } from '@/app/Provider';
import { PoweredByBGGLogo } from '@/app/ui/PoweredByBGGLogo';
import Link from 'next/link';
import React, { type CSSProperties, ReactNode } from 'react';
import { FaFirefox, FaSafari } from 'react-icons/fa6';

export default function Layout({ children }: { children: ReactNode }) {
    const { syncOn } = useExtension();

    return <Provider>
        <SettingsProvider>
            <TailwindProvider>
                <PluginMapProvider>
                    <CodesProvider>
                        <GameSelectionsProvider>
                            <GameUPCDataProvider>
                                <NextStepProvider>
                                    <div style={{
                                        minHeight: 'calc(100dvh - 8em)'
                                    }}>
                                        {children}
                                    </div>
                                    <div className="h-[8em] mt-6 flex flex-col justify-end">
                                        {!syncOn && <div className="flex justify-center pb-4">
                                            <Link className={`btn max-w-2/3 rounded-full
                                                    bg-[#e07ca4] text-white
                                                    flex items-center justify-center gap-1
                                                    uppercase text-md font-sharetech`}
                                                 href="/extension">
                                            <FaFirefox className="w-4 h-4" />
                                            <FaSafari className="w-4 h-4" />
                                            Get the Extension
                                        </Link></div>}
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

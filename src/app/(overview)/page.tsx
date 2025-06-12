'use client';

import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useTailwindBreakpoint } from '@/app/lib/TailwindBreakpointProvider';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { Scanner, ScannerProps } from '@/app/ui/Scanner';
import React, { Suspense, useEffect, useState } from 'react';

export default function Home() {
    const breakpoint = useTailwindBreakpoint();

    const {
        gameDataMap,
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCData();

    const [codes, setCodes] = useState<string[]>([]);

    useEffect(() => {
        if (!gameDataMap) {
            return;
        }
        setCodes(Object.keys(gameDataMap));
    }, []);

    void submitOrVerifyGame;
    void removeGame;

    const onScan = (async (code: string) => {
        if (!codes.includes(code)) {
            codes.push(code);
            setCodes(codes);
        }
        return getGameData(code);
    }) as ScannerProps['onScan'];

    return breakpoint && (
        <div className="flex flex-col w-full items-center p-3 sm:p-4">
            <div className="flex gap-2 pb-3 mt-20 md:mt-30 p-3 sm:pb-5 bg-overlay">
                <Suspense>
                    <div>
                        <Scanner onScan={onScan} />
                    </div>
                </Suspense>
            </div>
            <Suspense>
                <div className="relative w-full h-full bg-orange-50 p-2">
                    <div className="flex flex-col justify-center h-full w-full">
                        {codes.length > 0
                            ? (<Scanlist codes={codes} gameUPCResults={gameDataMap} />)
                            : (
                                <div className="w-full flex flex-col items-center justify-items-center text-center">
                                    <h2 className="text-xl tracking-widest">No Game UPCs Scanned</h2>
                                    <h4>Check your shelf before you wreck yourself</h4>
                                </div>
                            )
                        }
                    </div>
                </div>
            </Suspense>
        </div>
    );
}

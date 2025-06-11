'use client';

import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useTailwindBreakpoint } from '@/app/lib/TailwindBreakpointProvider';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { Scanner, ScannerProps } from '@/app/ui/Scanner';
import React, { Suspense, useEffect, useState } from 'react';
import { FaBarcode } from 'react-icons/fa6';

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
        return await getGameData(code);
    }) as ScannerProps['onScan'];

    return breakpoint && (
        <div className="flex flex-col w-full items-center p-3 sm:p-4">
            <div style={{
                width: breakpoint === 'mobile' ? '200px' : '400px',
                height: breakpoint === 'mobile' ? '100px' : '150px',
            }} className="bg-[image:url(/images/flair-top.png)] mb-1 md:mb-3 bg-cover bg-top opacity-60"> </div>
            <div className="flex gap-2 pb-3 sm:pb-5">
                <Suspense>
                    <div>
                        <Scanner onScan={onScan} />
                        <h2 className="text-center">Scan a Board Game UPC</h2>
                    </div>
                </Suspense>
                {/*<div className="flex flex-col gap-2">*/}
                {/*    <button className={`p-2 cursor-pointer bg-gray-300 rounded-sm`}>*/}
                {/*        <FaBarcode size={20} />*/}
                {/*    </button>*/}
                {/*    <button className={`p-2 cursor-pointer bg-gray-100 rounded-sm`}>*/}
                {/*        <GiCardPick size={20} />*/}
                {/*    </button>*/}
                {/*</div>*/}
            </div>
            {/*<Suspense>*/}
            {/*    <BggLoginForm />*/}
            {/*</Suspense>*/}
            <Suspense>
                <div className="relative w-full h-full bg-orange-50 p-2">
                    <div className="flex flex-col justify-center h-full w-full">
                        {codes.length > 0
                            ? (<Scanlist codes={codes} gameUPCResults={gameDataMap} />)
                            : (
                                <div className="w-full flex flex-col items-center justify-items-center text-center">
                                    <h2 className="text-xl tracking-widest">No Game UPCs Scanned</h2>
                                    <FaBarcode size={128} />
                                    <h3>Check your shelf before you wreck yourself</h3>
                                </div>
                            )
                        }
                    </div>
                </div>
            </Suspense>
            <div style={{
                width: breakpoint === 'mobile' ? '200px' : '400px',
                height: breakpoint === 'mobile' ? '80px' : '100px',
            }} className="bg-[image:url(/images/flair-bottom.png)] mt-1 md:mt-3 bg-cover bg-bottom opacity-60"> </div>
        </div>
    );
}

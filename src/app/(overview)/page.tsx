'use client';

import { useGameUPCApi } from '@/app/lib/hooks/useGameUPCApi';
import { useTailwindBreakpoint } from '@/app/lib/TailwindBreakpointProvider';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { Scanner, ScannerProps } from '@/app/ui/Scanner';
import React, { Suspense, useState } from 'react';
import { FaBarcode } from 'react-icons/fa6';

export default function Home() {
    const breakpoint = useTailwindBreakpoint();

    const {
        gameDataMap,
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCApi({});

    const [codes, setCodes] = useState<string[]>([]);

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
        <div className="flex flex-col w-full items-end md:items-center p-3 sm:p-4">
            <div className="flex gap-2 pb-3 sm:pb-5">
                <Suspense>
                    <div>
                        <h2 className="mb-1 text-center">Scan a Board Game UPC</h2>
                        <Scanner onScan={onScan} />
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
        </div>
    );
}

'use client';

import { loader } from '@/app/(overview)/loading';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useTailwindBreakpoint } from '@/app/lib/TailwindBreakpointProvider';
import { BggCollectionForm } from '@/app/ui/BggCollectionForm';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { Scanner } from '@/app/ui/Scanner';
import { useNextStep } from 'nextstepjs';
import React, { Suspense, useEffect, useState } from 'react';
import { hasSeenTour } from '../lib/tours';

export default function Page() {
    const breakpoint = useTailwindBreakpoint();

    const { startNextStep } = useNextStep();

    const {
        gameDataMap,
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCData();

    const [codes, setCodes] = useState<string[]>([]);

    useEffect(() => {
        if (!breakpoint || hasSeenTour('scanner')) {
            return;
        }
        startNextStep('scanner');
    }, [breakpoint, startNextStep]);

    useEffect(() => {
        if (!gameDataMap) {
            return;
        }
        setCodes(Object.keys(gameDataMap));
    }, []);

    void submitOrVerifyGame;
    void removeGame;

    const onScan = (code: string) => {
        if (!codes.includes(code)) {
            codes.push(code);
            setCodes(codes);
        }
        getGameData(code).then();
    };

    return <>
        <NavDrawer />
        {breakpoint ? (
             <div className="flex flex-col w-full items-center p-3 sm:p-4">
                 <div className="flex gap-2 pb-3 mt-20 md:mt-30 p-3 sm:pb-5 bg-overlay">
                     <Suspense fallback={loader('Focusing...')}>
                         <div>
                             <Scanner onScan={onScan} />
                         </div>
                     </Suspense>
                 </div>
                 <Suspense>
                     <BggCollectionForm />
                 </Suspense>
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
         ) : (
             <div className="absolute top-0 w-screen h-screen right-0 bottom-0 left-0 flex justify-center items-center">
                 {loader('Warming up...')}
             </div>
         )
    }</>;
}

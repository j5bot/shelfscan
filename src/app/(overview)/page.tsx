'use client';

import { loader } from '@/app/(overview)/loading';
import { useCodes } from '@/app/lib/CodesProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { useTailwindBreakpoint } from '@/app/lib/TailwindProvider';
import { hasSeenTour } from '@/app/lib/tours';
import { ScanHistoryError, ScanHistoryMatchStatus } from '@/app/lib/types/scanHistory';
import { BggCollectionForm } from '@/app/ui/BggCollectionForm';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { Scanner } from '@/app/ui/Scanner';
import { SessionLink } from '@/app/ui/SessionLink';
import { UnmatchedScansTab } from '@/app/ui/UnmatchedScansTab';
import { UseCaseBadges } from '@/app/ui/UseCaseBadges';
import { GameUPCStatus } from 'gameupc-hooks/types';
import { useSearchParams } from 'next/navigation';
import { useNextStep } from 'nextstepjs';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const convertToCompressedCodes = (codes: string[]) => codes
    .map(code => parseInt(code, 10).toString(36));

const convertFromCompressedCodes = (codes: string[]) => codes
    .map(code => parseInt(code, 36).toString(10));

export default function Page() {
    useTitle('ShelfScan | Scanner');

    const breakpoint = useTailwindBreakpoint();
    const searchParams = useSearchParams();
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);

    const { startNextStep } = useNextStep();

    const {
        gameDataMap,
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCData();

    const {
        codes,
        addHistoryID,
        setCodes,
    } = useCodes();

    const { recordScan } = useScanHistory();

    const [activeTab, setActiveTab] = useState<'current' | 'unmatched'>('current');
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const compressedCodes = useMemo(() =>
        convertToCompressedCodes(codes),
    [codes]);

    useEffect(() => {
        if (!breakpoint) {
            return;
        }
        if (!searchParams.get('scanner-tour') && hasSeenTour('scanner')) {
            return;
        }
        startNextStep('scanner');
    }, [breakpoint, searchParams, startNextStep]);

    const hasGameDataMap = !!gameDataMap;
    useEffect(() => {
        if (!gameDataMap) {
            return;
        }
        setCodes(Object.keys(gameDataMap));
    }, [setCodes, hasGameDataMap]);

    useEffect(() => {
        const upc = searchParams.get('u');
        if (!upc) {
            return;
        }
        setCodes(
            upc.includes('.') || upc.length < 12 ?
                convertFromCompressedCodes(upc.split('.')) :
                upc.split(',')
        );
    }, [searchParams, setCodes]);

    void submitOrVerifyGame;
    void removeGame;

    const onScan = useCallback((code: string) => {
        if (isScanning) {
            return;
        }
        setIsScanning(true);
        if (codes.includes(code)) {
            return;
        }

        getGameData(code).then(data => {
            if (!data) {
                return;
            }
            const bggInfo = data.bgg_info?.[0];
            recordScan({
                upc: code,
                username: currentUsername ?? undefined,
                status: ScanHistoryMatchStatus.matched,
                verified: data?.bgg_info_status === GameUPCStatus.verified,
                gameName: bggInfo?.name,
                bggId: bggInfo?.id,
                thumbnailUrl: bggInfo?.thumbnail_url,
            }).then(result => {
                if (result.kind !== 'added') {
                    return;
                }
                addHistoryID(code, result.id);
            });
        }).catch(() => {
            recordScan({
                upc: code,
                username: currentUsername ?? undefined,
                status: ScanHistoryMatchStatus.unmatched,
                error: ScanHistoryError.other,
            }).then(result => {
                if (result.kind !== 'added') {
                    return;
                }
                addHistoryID(code, result.id);
            });
        }).finally(() => setIsScanning(false));

        codes.unshift(code);
        setCodes(codes);
    }, [codes, isScanning, setCodes, recordScan, getGameData, currentUsername]);

    const tabClass = (tab: 'current' | 'unmatched') =>
        `tab${activeTab === tab ? ' tab-active' : ''}`;

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
                     <div id="scanlist" className={`relative w-full h-full
                        bg-[#f1eff9] dark:bg-yellow-700 p-2
                        ${currentUsername ? 'rounded-lg' : 'rounded-b-lg'}`}>
                         <div role="tablist" className="tabs tabs-border mb-2">
                             <button role="tab" className={tabClass('current')}
                                     onClick={() => setActiveTab('current')}>
                                 Current Scans
                             </button>
                             <button role="tab" className={tabClass('unmatched')}
                                     onClick={() => setActiveTab('unmatched')}>
                                 Unmatched History
                             </button>
                         </div>
                         <div className="flex flex-col justify-center h-full w-full">
                             {activeTab === 'current' && (
                                 codes.length > 0
                                 ? (<>
                                     <Scanlist gameUPCResults={gameDataMap} />
                                     <div className="flex justify-center pt-4 pb-2">
                                         <button
                                             className="btn btn-sm rounded-full bg-gray-300 dark:bg-gray-600
                                                 text-sm uppercase cursor-pointer"
                                             onClick={() => setCodes([])}
                                         >
                                             Clear All
                                         </button>
                                     </div>
                                 </>)
                                 : (
                                     <div className="w-full flex flex-col items-center justify-items-center text-center">
                                         <h2 className="text-xl tracking-widest">No Game UPCs Scanned</h2>
                                         <div className="mt-2 mb-2 text-sm">
                                             <h3>- Scan UPCs, Then -</h3>
                                             <UseCaseBadges />
                                         </div>
                                         <h4 className="text-lg">Check your shelf before you wreck yourself</h4>
                                     </div>
                                 )
                             )}
                             {activeTab === 'unmatched' && <UnmatchedScansTab />}
                         </div>
                     </div>
                     <SessionLink compressedCodes={compressedCodes} />
                 </Suspense>
             </div>
         ) : (
             <div className="absolute top-0 w-screen h-screen right-0 bottom-0 left-0 flex justify-center items-center">
                 {loader('Warming up...')}
             </div>
         )
    }</>;
}

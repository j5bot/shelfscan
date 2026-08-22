import { loader } from '@/app/(overview)/loading';
import { DocumentMessageResponseDetail } from '@/app/lib/extension/messageTypes';
import { useInfoCollectionStatus } from '@/app/lib/hooks/useInfoCollectionStatus';
import { useScanRecorder } from '@/app/lib/hooks/useScanRecorder';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { useTailwindBreakpoint } from '@/app/lib/TailwindProvider';
import { PossibleStatusWithAllAndNone } from '@/app/lib/types/bgg';
import { BatchAddButton } from '@/app/ui/batch/BatchAddButton';
import { SwapAddButton } from '@/app/ui/batch/SwapAddButton';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { Scanner } from '@/app/ui/Scanner';
import { ScanToasts } from '@/app/ui/ScanToasts';
import { GameUPCBggInfo } from 'gameupc-hooks/types';
import React, { CSSProperties, Suspense, useCallback, useRef, useState } from 'react';
import { FaBarcode } from 'react-icons/fa6';

export type BatchViewProps = {
    fns?: {
        addGameToCollection?: (
            info: GameUPCBggInfo,
            versionId?: number | undefined,
            collectionId?: number | undefined,
        ) => void | Promise<DocumentMessageResponseDetail | undefined>;
    }
};

export const BatchView = (props: BatchViewProps) => {
    const { fns: { addGameToCollection } = {} } = props;
    const breakpoint = useTailwindBreakpoint();

    const { hasExport, isCollection, isSwap, isTrade } = useTradeMode();

    let batchScanHeading = 'Batch Scan Mode';
    let batchScanBody = 'Scan multiple games, then add them to your BGG collection all at once.';
    switch (true) {
        case isSwap:
            batchScanHeading = 'Swap Scan';
            batchScanBody = 'Scan multiple games, then export them for a Swap';
            break;
        case isTrade:
            batchScanHeading = 'Trade Scan';
            batchScanBody = 'Scan multiple games, then export them for a Trade';
            break;
    }

    const { codes, removeCode, setCodes, ...statuses } = useInfoCollectionStatus();

    const {
        onScan,
        duplicateUpc,
        historyLimitReached,
        clearDuplicateUpc,
        clearHistoryLimitReached,
    } = useScanRecorder();

    const [addedNames, setAddedNames] = useState<string[]>([]);
    const [shownStatus, setShownStatus] = useState<PossibleStatusWithAllAndNone>(hasExport ? 'all' : 'none');
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onComplete = useCallback((names: string[]) => {
        if (names.length === 0) { return; }
        setAddedNames(names);
        if (toastTimerRef.current !== null) { clearTimeout(toastTimerRef.current); }
        toastTimerRef.current = setTimeout(() => {
            toastTimerRef.current = null;
            setAddedNames([]);
        }, 5000);
    }, []);

    const onClear = useCallback((status?: PossibleStatusWithAllAndNone) => {
        if (!status) {
            setCodes([]);
            return;
        }
        setCodes((prev: string[]) => prev.filter(code => !statuses[status].includes(code)));
    }, [statuses, setCodes]);

    if (!breakpoint) {
        return <>
            <NavDrawer />
            <div className="absolute top-0 w-screen h-screen right-0 bottom-0 left-0 flex justify-center items-center">
                {loader('Warming up...')}
            </div>
        </>;
    }

    const segments = isCollection ? [
        {
            key: 'none',
            name: 'New',
            codes: statuses['none'],
        },
        {
            key: 'prevowned',
            name: 'Prev.',
            codes: statuses['prevowned'],
        },
        {
            key: 'own',
            name: 'Own',
            codes: statuses['own'],
        },
        {
            key: 'all',
            name: 'Scanned',
            codes,
        },
    ] as const : [] as const;

    return <>
        <NavDrawer />
        <ScanToasts
            duplicateUpc={duplicateUpc}
            historyLimitReached={historyLimitReached}
            onClearDuplicate={clearDuplicateUpc}
            onClearLimitReached={clearHistoryLimitReached}
        />
        {addedNames.length > 0 && (
            <div className="toast toast-top toast-center z-50" onClick={() => setAddedNames([])}>
                <div role="status" className="alert alert-success shadow-lg cursor-pointer">
                    <span className="text-sm">
                        Added {addedNames.length} game{addedNames.length !== 1 ? 's ' : ' '} to collection:&nbsp;
                        {addedNames.join(', ')}
                    </span>
                </div>
            </div>
        )}
        <div className="flex flex-col w-full items-center p-3 sm:p-4">
            <div className="flex gap-2 pb-3 mt-20 md:mt-30 p-3 sm:pb-5 bg-overlay">
                <Suspense fallback={loader('Focusing...')}>
                    <div>
                        <Scanner onScan={onScan} />
                    </div>
                </Suspense>
            </div>
            <Suspense>
                <div className={`relative w-full h-full
                    bg-[#f1eff9] dark:bg-yellow-700 p-2 rounded-lg`}>
                    <div className="flex flex-col justify-center h-full w-full">
                        {codes.length > 0
                         ? <>
                             <div className="pb-2 pt-1">
                                 {isCollection && addGameToCollection && <BatchAddButton
                                     codes={shownStatus === 'all' ? codes : statuses[shownStatus] ?? []}
                                     addGameToCollection={addGameToCollection}
                                     onComplete={onComplete}
                                 />}
                                 {hasExport && <SwapAddButton
                                     codes={codes}
                                 />}
                             </div>

                             {segments.length > 0 && <div
                                 role="tablist"
                                 aria-label="Collection views"
                                 className="tabs tabs-border mb-2"
                                 style={{'--tab-height': '28px'} as CSSProperties}
                             >
                                 {segments
                                     .map(({key, name, codes}) => {
                                         return <button
                                             id={`${key}-tab`}
                                             role="tab"
                                             aria-selected={shownStatus === key}
                                             aria-controls={`${key}-panel`}
                                             tabIndex={shownStatus === key ? 0 : -1}
                                             className={`tab${shownStatus === key ? ' tab-active' : ''}
                                                text-xs cursor-pointer pb-1`}
                                             onClick={() => shownStatus !== key && setShownStatus(
                                                 key)}
                                             key={key}
                                         >
                                             {name}
                                             <span className="badge badge-xs text-xs p-0.5 ml-0.5" style={{scale: 0.85}}>
                                                    {codes?.length ?? 0}
                                                </span>
                                         </button>;
                                     })}
                             </div>}

                             <section
                                 id={`${shownStatus}-panel`}
                                 role="tabpanel"
                                 aria-labelledby={`${shownStatus}-tab`}
                                 className="w-full"
                             >
                                 <Scanlist
                                     codes={shownStatus === 'all' ? codes : statuses[shownStatus] ?? []}
                                     removeCode={removeCode}
                                     showGame={true}
                                 />
                             </section>

                             <div className="flex justify-center gap-3 pt-4 pb-2">
                                 {isCollection && <button
                                     className="btn btn-sm rounded-full bg-gray-300 dark:bg-gray-600
                                            text-sm uppercase cursor-pointer"
                                     onClick={() => onClear(shownStatus)}
                                 >
                                     Clear Segment
                                 </button>}
                                 <button
                                     className="btn btn-sm rounded-full bg-gray-300 dark:bg-gray-600
                                                text-sm uppercase cursor-pointer"
                                     onClick={() => onClear()}
                                 >
                                     Clear All
                                 </button>
                             </div>
                         </>
                         : <div className="w-full flex flex-col items-center justify-items-center text-center">
                             <h2 className="text-xl tracking-widest">{batchScanHeading}</h2>
                             <div className="mt-2 mb-2 text-sm">
                                 <p>{batchScanBody}</p>
                             </div>
                             <h4 className="text-lg flex items-center gap-2">
                                 <FaBarcode className="w-5 h-5" /> Start scanning!
                             </h4>
                         </div>
                        }
                    </div>
                </div>
            </Suspense>
        </div>
    </>;
};

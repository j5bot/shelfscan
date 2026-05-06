'use client';

import { loader } from '@/app/(overview)/loading';
import { useBatchSync } from '@/app/lib/extension/useBatchSync';
import { useInfoCollectionStatus } from '@/app/lib/hooks/useInfoCollectionStatus';
import { useScanRecorder } from '@/app/lib/hooks/useScanRecorder';
import { useSelector } from '@/app/lib/hooks';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { RootState } from '@/app/lib/redux/store';
import { useTailwindBreakpoint } from '@/app/lib/TailwindProvider';
import { PossibleStatusWithAllAndNone } from '@/app/lib/types/bgg';
import { BatchAddButton } from '@/app/ui/batch/BatchAddButton';
import { Scanlist } from '@/app/ui/games/Scanlist';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { ScanToasts } from '@/app/ui/ScanToasts';
import { Scanner } from '@/app/ui/Scanner';
import Link from 'next/link';
import React, { Suspense, useCallback, useRef, useState } from 'react';
import { FaBarcode } from 'react-icons/fa6';

export default function Page() {
    useTitle('ShelfScan | Batch Scan');

    const breakpoint = useTailwindBreakpoint();
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);

    const { canBatch, addGameToCollection } = useBatchSync();
    const { codes, removeCode, setCodes, ...statuses } = useInfoCollectionStatus();

    const {
        onScan,
        duplicateUpc,
        historyLimitReached,
        clearDuplicateUpc,
        clearHistoryLimitReached,
    } = useScanRecorder();

    const [addedNames, setAddedNames] = useState<string[]>([]);
    const [shownStatus, setShownStatus] = useState<PossibleStatusWithAllAndNone>('none');
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
        setCodes(codes.filter(code => !statuses[status].includes(code)));
    }, [statuses, setCodes]);

    if (!breakpoint) {
        return <>
            <NavDrawer />
            <div className="absolute top-0 w-screen h-screen right-0 bottom-0 left-0 flex justify-center items-center">
                {loader('Warming up...')}
            </div>
        </>;
    }

    if (!canBatch) {
        return <>
            <NavDrawer />
            <div className="w-screen pt-20 flex justify-center">
                <div className={`flex flex-col items-center gap-4 w-10/12 md:w-2/3
                    p-6 rounded-xl bg-base-100 text-center`}>
                    <h2 className="text-2xl uppercase tracking-widest">Batch Scan</h2>
                    <p className="text-sm">
                        Batch scanning requires the ShelfScan browser extension and a
                        logged-in BGG account.
                    </p>
                    {!currentUsername && <p className="text-sm">
                        Please sign in with your BGG username on the
                        {' '}<Link href="/" className="underline">scanner page</Link>.
                    </p>}
                    <Link className={`btn rounded-full
                        bg-[#e07ca4] text-white
                        flex items-center justify-center gap-1
                        uppercase text-md font-sharetech`}
                          href="/extension">
                        Get the Extension
                    </Link>
                </div>
            </div>
        </>;
    }

    const segments = [
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
    ] as const;

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
                                <div className="pb-3 pt-1">
                                    <BatchAddButton
                                        codes={statuses[shownStatus] ?? []}
                                        addGameToCollection={addGameToCollection}
                                        onComplete={onComplete}
                                    />
                                </div>

                                <div className="flex justify-start gap-1 pb-1">
                                    {segments
                                        .map(({key, name, codes}) => (<button className={`btn btn-sm rounded-md ${
                                            shownStatus === key ?
                                                'bg-white dark:bg-gray-300'
                                                   : 'bg-gray-300 dark:bg-gray-600'
                                            }
                                            text-sm cursor-pointer`}
                                            onClick={() => shownStatus !== key && setShownStatus(key)}
                                            key={key}
                                        >
                                            {name} <span className="badge badge-xs text-xs">
                                                {codes?.length ?? 0}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <Scanlist
                                    codes={shownStatus === 'all' ? codes : statuses[shownStatus] ?? []}
                                    removeCode={removeCode} showGame={true} />
                                <div className="flex justify-center gap-3 pt-4 pb-2">
                                    <button
                                        className="btn btn-sm rounded-full bg-gray-300 dark:bg-gray-600
                                            text-sm uppercase cursor-pointer"
                                        onClick={() => onClear(shownStatus)}
                                    >
                                        Clear Segment
                                    </button>
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
                                <h2 className="text-xl tracking-widest">Batch Scan Mode</h2>
                                <div className="mt-2 mb-2 text-sm">
                                    <p>Scan multiple games, then add them all to your BGG collection at once.</p>
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
}

'use client';

import { useBatchSync } from '@/app/lib/extension/useBatchSync';
import { useSelector } from '@/app/lib/hooks';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { RootState } from '@/app/lib/redux/store';
import { BatchView } from '@/app/ui/batch/BatchView';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import React from 'react';

export default function Page() {
    useTitle('ShelfScan | Batch Scan');

    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);

    const { canBatch, addGameToCollection } = useBatchSync();

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
                        bg-brand-background text-white
                        flex items-center justify-center gap-1
                        uppercase text-md font-sharetech`}
                          href="/extension">
                        Get the Extension
                    </Link>
                </div>
            </div>
        </>;
    }

    return <BatchView fns={{
        addGameToCollection,
    }}/>;
}

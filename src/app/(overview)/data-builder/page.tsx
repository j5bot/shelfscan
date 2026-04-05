'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { DataBuilder } from '@/app/ui/DataBuilder';
import { NavDrawer } from '@/app/ui/NavDrawer';

export default function DataBuilderPage() {
    useTitle('ShelfScan | Data Builder');

    return <>
        <NavDrawer />
        <div className="w-screen pt-15 flex justify-center">
            <div className="w-full max-w-6xl px-4">
                <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    Data Builder
                </h1>
                <DataBuilder />
            </div>
        </div>
    </>;
}

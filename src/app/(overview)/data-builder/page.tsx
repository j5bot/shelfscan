'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { DataBuilder } from '@/app/ui/DataBuilder';
import { NavDrawer } from '@/app/ui/NavDrawer';

export default function DataBuilderPage() {
    useTitle('ShelfScan | Data Builder');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center">
                    Data Form Builder
                </h1>
                <DataBuilder />
            </div>
        </div>
    </>;
}

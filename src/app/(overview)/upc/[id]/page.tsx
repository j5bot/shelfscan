import { SelectVersionProvider } from '@/app/lib/SelectVersionProvider';
import { SelectVersion } from '@/app/ui/games/SelectVersion';
import React, { Suspense } from 'react';

export default async function SelectVersionPage({
    params,
}: {
    params: Promise<{id: string}>
}) {
    const id = (await params).id;
    return <Suspense>
        <SelectVersionProvider id={id}>
            <SelectVersion />
        </SelectVersionProvider>
    </Suspense>;
}

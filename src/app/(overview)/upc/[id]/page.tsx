import { SelectVersion } from '@/app/ui/games/SelectVersion';
import React, { Suspense } from 'react';

export default async function SelectVersionPage({
    params,
}: {
    params: Promise<{id: string}>
}) {
    return <Suspense><SelectVersion id={(await params).id} /></Suspense>;
}

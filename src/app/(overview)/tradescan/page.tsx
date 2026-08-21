'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { BatchView } from '@/app/ui/batch/BatchView';
import React from 'react';

export default function Page() {
    useTitle('ShelfScan | Trade Scan');

    return <BatchView mode={'trade'} />;
}

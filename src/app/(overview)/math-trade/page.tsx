'use client';

import { MathTradeDialog } from '@/app/ui/MathTradeDialog';
import { useRouter } from 'next/navigation';

export default function MathTradeLandingPage() {
    const router = useRouter();

    return (
        <MathTradeDialog
            isOpen={true}
            onClose={() => router.push('/collection')}
            onLoaded={(id) => router.push(`/math-trade/${id}`)}
        />
    );
}

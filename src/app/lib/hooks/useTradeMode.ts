import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export type TradeMode = {
    hasExport: boolean;
    hasTrade: boolean;
    isSwap: boolean;
    isTrade: boolean;
    isMathTrade: boolean;
    isBatchTrade: boolean;
    isCollection: boolean;
};

export const useTradeMode = () => {
    const pathname = usePathname();

    return useMemo(() => {

        const isBatch = pathname?.startsWith('/batch') ?? false;
        const isMathTrade = pathname?.startsWith('/math-trade') ?? false;
        const isSwap = pathname?.startsWith('/swap') ?? false;
        const isTrade = pathname?.startsWith('/trade') ?? false;
        const hasExport = isSwap || isTrade;
        const hasTrade = isMathTrade || isSwap || isTrade;

        const isBatchTrade = (hasExport && pathname?.includes('scan')) ?? false;
        const isCollection = (isBatch ||
                (hasExport && !pathname?.includes('scan'))
            ) ?? false;

        return {
            hasExport,
            hasTrade,
            isBatch,
            isSwap,
            isTrade,
            isMathTrade,
            isBatchTrade,
            isCollection,
        } as TradeMode;
    }, [pathname]);
};

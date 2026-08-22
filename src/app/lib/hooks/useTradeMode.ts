import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export type TradeMode = {
    hasExport: boolean;
    hasTrade: boolean;
    isSwap: boolean;
    isTrade: boolean;
    isMathTrade: boolean;
    isBatchScan: boolean;
    isCollection: boolean;
};

export const useTradeMode = () => {
    const pathname = usePathname();

    return useMemo(() => {

        const isMathTrade = pathname?.startsWith('/math-trade') ?? false;
        const isSwap = pathname?.startsWith('/swap') ?? false;
        const isTrade = pathname?.startsWith('/trade') ?? false;
        const hasExport = isSwap || isTrade;
        const hasTrade = isMathTrade || isSwap || isTrade;

        const isBatchScan = (hasExport && pathname?.includes('scan')) ?? false;
        const isCollection = (hasExport && !pathname?.includes('scan')) ?? false;

        return {
            hasExport,
            hasTrade,
            isSwap,
            isTrade,
            isMathTrade,
            isBatchScan,
            isCollection,
        } as TradeMode;
    }, [pathname]);
};

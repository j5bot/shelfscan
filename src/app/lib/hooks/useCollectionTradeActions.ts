import { useOLWLGMathTrade } from '@/app/lib/hooks/useOLWLGMathTrade';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { useTradeSelection } from '@/app/lib/hooks/useTradeSelection';
import { downloadSwapExport, downloadSwapExportCsv } from '@/app/lib/utils/swapExport';
import { useRouter } from 'next/navigation';

export type UseCollectionTradeActionsOptions = {
    mathTrade: ReturnType<typeof useOLWLGMathTrade>;
    tradeSelection: ReturnType<typeof useTradeSelection>;
};

/** The collection page's geeklist and trade actions, for the current trade mode. */
export const useCollectionTradeActions = (options: UseCollectionTradeActionsOptions) => {
    const { mathTrade, tradeSelection } = options;
    const router = useRouter();
    const { hasExport, isMathTrade, isTrade } = useTradeMode();

    const showGeeklistPage = (id: number) => {
        router.replace(`/math-trade/${id}`);
    };

    // a loaded geeklist opens its math trade page there, or math trade mode elsewhere
    const openGeeklist = (id: number) => isMathTrade
                                         ? showGeeklistPage(id)
                                         : mathTrade.setMathTradeMode(true);

    const selectGeeklist = (id: number) => {
        mathTrade.setActiveGeekListId(id);
        if (isMathTrade) {
            showGeeklistPage(id);
        }
    };

    // swap/trade pages export a file; math trades post to the geeklist via the extension
    const runTradeAction = () => void (
        hasExport
        ? tradeSelection.handleSwapExport(isTrade ? downloadSwapExportCsv : downloadSwapExport)
        : tradeSelection.handleBulkMathTradeAdd()
    );

    const isTradeActionBusy = hasExport ? tradeSelection.isExportingSwap : mathTrade.isBulkMathTradeAdding;

    return { openGeeklist, selectGeeklist, runTradeAction, isTradeActionBusy };
};

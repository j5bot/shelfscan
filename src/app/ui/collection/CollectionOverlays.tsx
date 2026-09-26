import { useAddToCollectionSelection } from '@/app/lib/hooks/useAddToCollectionSelection';
import { useOLWLGMathTrade } from '@/app/lib/hooks/useOLWLGMathTrade';
import { useTradeSelection } from '@/app/lib/hooks/useTradeSelection';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { AlreadyInGeeklistModal } from '@/app/ui/collection/AlreadyInGeeklistModal';
import { ConfirmAddToCollectionModal } from '@/app/ui/collection/ConfirmAddToCollectionModal';
import { DismissibleToast } from '@/app/ui/DismissibleToast';
import { CollectionItemModal } from '@/app/ui/games/CollectionItemModal';
import { MathTradeDialog } from '@/app/ui/MathTradeDialog';

type CollectionOverlaysProps = {
    refreshError: string | null | undefined;
    onDismissRefreshError: () => void;
    selectedItem: BggCollectionItem | null;
    onCloseItem: () => void;
    onGeeklistLoaded: (id: number) => void;
    mathTrade: ReturnType<typeof useOLWLGMathTrade>;
    tradeSelection: ReturnType<typeof useTradeSelection>;
    addSelection: ReturnType<typeof useAddToCollectionSelection>;
};

/** Toasts, modals and dialogs that float above the collection page. */
export const CollectionOverlays = ({
    refreshError,
    onDismissRefreshError,
    selectedItem,
    onCloseItem,
    onGeeklistLoaded,
    mathTrade,
    tradeSelection,
    addSelection,
}: CollectionOverlaysProps) => {
    const addedCount = addSelection.addedNames.length;

    return <>
        {refreshError && (
            <div className="toast toast-top toast-center z-50">
                <div role="alert" className="alert alert-error shadow-lg">
                    <span className="text-sm">{refreshError}</span>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={onDismissRefreshError}
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}
        {mathTrade.mathTradeError && (
            <DismissibleToast kind="error" onDismiss={() => mathTrade.setMathTradeError(null)}>
                <span className="text-sm">{mathTrade.mathTradeError}</span>
            </DismissibleToast>
        )}
        <CollectionItemModal item={selectedItem} onClose={onCloseItem} />
        <MathTradeDialog
            isOpen={mathTrade.showMathTradeDialog}
            onClose={() => mathTrade.setShowMathTradeDialog(false)}
            onLoaded={onGeeklistLoaded}
        />
        {addedCount > 0 && (
            <DismissibleToast kind="success" role="status" onDismiss={addSelection.clearAddedNames}>
                <span className="text-sm">
                    Added {addedCount} game{addedCount !== 1 ? 's' : ''} to collection:&nbsp;
                    {addSelection.addedNames.join(', ')}
                </span>
            </DismissibleToast>
        )}
        {addSelection.showConfirmModal && (
            <ConfirmAddToCollectionModal
                entries={addSelection.selectedEntries}
                selectedCount={addSelection.selectedIds.size}
                isAdding={addSelection.isAdding}
                onCancel={addSelection.cancelAdd}
                onConfirm={addSelection.addSelected}
            />
        )}
        {tradeSelection.pendingMathTradeToggleId !== null && (
            <AlreadyInGeeklistModal
                onCancel={tradeSelection.cancelPendingToggle}
                onConfirm={tradeSelection.confirmPendingToggle}
            />
        )}
    </>;
};

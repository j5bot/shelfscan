import { NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { FaCloudArrowUp, FaXmark } from 'react-icons/fa6';

type ConfirmAddToCollectionModalProps = {
    entries: NotInCollectionEntry[];
    selectedCount: number;
    isAdding: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export const ConfirmAddToCollectionModal = ({
    entries,
    selectedCount,
    isAdding,
    onCancel,
    onConfirm,
}: ConfirmAddToCollectionModalProps) =>
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm add to collection"
    >
        <div
            className="relative bg-base-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
        >
            <button
                className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                onClick={onCancel}
                aria-label="Close"
                type="button"
            >
                <FaXmark />
            </button>
            <h2 className="text-lg font-semibold mb-2">
                Add to BGG Collection?
            </h2>
            <p className="text-sm text-base-content/70 mb-3">
                Add {selectedCount} game{selectedCount !== 1 ? 's' : ''} to your BGG collection:
            </p>
            <ul className="text-sm mb-5 max-h-48 overflow-y-auto space-y-1 pl-3">
                {entries.map(e => (
                    <li key={e.id} className="truncate list-disc text-base-content/80">
                        {e.gameName ?? e.upc}
                    </li>
                ))}
            </ul>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-primary gap-1"
                    onClick={onConfirm}
                    disabled={isAdding}
                >
                    {isAdding
                        ? <span className="loading loading-bars loading-xs" />
                        : <FaCloudArrowUp />
                    }
                    Add to Collection
                </button>
            </div>
        </div>
    </div>;

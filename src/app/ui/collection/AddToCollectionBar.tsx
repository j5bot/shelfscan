import { FaCloudArrowUp } from 'react-icons/fa6';

type AddToCollectionBarProps = {
    selectionMode: boolean;
    selectedCount: number;
    isAdding: boolean;
    onToggleSelectionMode: () => void;
    onRequestAdd: () => void;
};

export const AddToCollectionBar = ({
    selectionMode,
    selectedCount,
    isAdding,
    onToggleSelectionMode,
    onRequestAdd,
}: AddToCollectionBarProps) => {
    const games = `Game${selectedCount !== 1 ? 's' : ''}`;

    return <div className="flex items-center justify-between gap-2 pt-2 p-2 bg-overlay">
        <button
            type="button"
            className={`btn btn-sm rounded-md ${selectionMode ? 'btn-primary' : 'text-base-content/70'}`}
            onClick={onToggleSelectionMode}
            aria-pressed={selectionMode}
        >
            {selectionMode ? 'Exit Select' : 'Select Items'}
        </button>
        {selectionMode && selectedCount > 0 && (
            <button
                type="button"
                className={`btn rounded-full pointer-events-auto
                    bg-brand-background text-white
                    flex items-center justify-center gap-2
                    uppercase text-base font-sharetech
                    pl-6 pr-6 pt-2 pb-2
                    ${isAdding ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#d06b93] cursor-pointer'}`}
                onClick={onRequestAdd}
                disabled={isAdding}
                aria-label={`Add ${selectedCount} ${games.toLowerCase()} to collection`}
            >
                {isAdding
                 ? <span className="loading loading-bars loading-sm" />
                 : <FaCloudArrowUp className="w-4 h-4" />
                }
                Add {selectedCount} {games} to Collection
            </button>
        )}
        {selectionMode && (
            <span className="text-xs text-base-content/60 pr-1">
                {selectedCount > 0 ? `${selectedCount} selected` : ''}
            </span>
        )}
    </div>;
};

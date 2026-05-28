import { type FilterPreset } from '@/app/lib/hooks/useCollectionFilters';
import { useEffect } from 'react';
import { FaCopy } from 'react-icons/fa';
import { FaXmark } from 'react-icons/fa6';
import { CgRename } from 'react-icons/cg';

type SavedFiltersModalProps = {
    savedFilters: FilterPreset[];
    onRename: (id: number) => void;
    onDelete: (id: number) => void;
    onDuplicate: (id: number) => void;
    onClose: () => void;
};

export const SavedFiltersModal = ({
    savedFilters,
    onRename,
    onDelete,
    onDuplicate,
    onClose,
}: SavedFiltersModalProps) => {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Filter Management"
        >
            <div
                className="relative bg-base-100 rounded-2xl p-6 pt-8 w-full max-w-sm mx-4 shadow-xl flex flex-col max-h-[80dvh]"
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <FaXmark />
                </button>
                <h2 className="text-lg font-semibold mb-3">Filter Management</h2>
                {savedFilters.length === 0 ? (
                    <p className="text-sm text-base-content/60 py-4 text-center">
                        No saved filter presets.
                    </p>
                ) : (
                    <ul className="overflow-y-auto flex-1 divide-y divide-base-200">
                        {savedFilters.map(preset => (
                            <li key={preset.id} className="flex items-center gap-1 py-0.5">
                                <span className="text-xs truncate flex-1">{preset.name}</span>
                                <div className="flex gap-0.5 shrink-0">
                                    <button
                                        type="button"
                                        className="btn btn-xs rounded-sm"
                                        onClick={() => onRename(preset.id)}
                                        aria-label={`Rename "${preset.name}"`}
                                        title="Rename"
                                    >
                                        <CgRename size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-xs rounded-sm"
                                        onClick={() => onDuplicate(preset.id)}
                                        aria-label={`Duplicate "${preset.name}"`}
                                        title="Duplicate"
                                    >
                                        <FaCopy size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-xs rounded-sm btn-error"
                                        onClick={() => onDelete(preset.id)}
                                        aria-label={`Delete "${preset.name}"`}
                                        title="Delete"
                                    >
                                        <FaXmark size={12} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

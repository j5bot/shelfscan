import { FilterPreset } from '@/app/lib/hooks/useCollectionFilters';
import { SavedFiltersModal } from '@/app/ui/games/SavedFiltersModal';
import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { FaSliders } from 'react-icons/fa6';

type SavedFilterPresetsProps = {
    savedFilters: FilterPreset[];
    onLoadFilter: (preset: FilterPreset) => void;
    onRenameFilter: (id: number) => void;
    onDeleteFilter: (id: number) => void;
    onDuplicateFilter: (id: number) => void;
};

/** Button that opens a popover of saved filter presets, plus the "Manage…" dialog. */
export const SavedFilterPresets = (props: SavedFilterPresetsProps) => {
    const { savedFilters, onLoadFilter, onRenameFilter, onDeleteFilter, onDuplicateFilter } = props;

    const [showManageModal, setShowManageModal] = useState<boolean>(false);
    const [presetsPos, setPresetsPos] = useState<{ top: number; left: number } | null>(null);
    const presetsButtonRef = useRef<HTMLButtonElement>(null);
    const presetsOverlayRef = useRef<HTMLDivElement>(null);

    const handlePresetsClick = useCallback(() => {
        if (presetsPos) {
            setPresetsPos(null);
        } else {
            const rect = presetsButtonRef.current?.getBoundingClientRect();
            if (rect) { setPresetsPos({ top: rect.bottom + 4, left: rect.left }); }
        }
    }, [presetsPos]);

    useEffect(() => {
        if (!presetsPos) { return; }
        const handleMouseDown = (e: MouseEvent) => {
            if (
                !presetsButtonRef.current?.contains(e.target as Node) &&
                !presetsOverlayRef.current?.contains(e.target as Node)
            ) {
                setPresetsPos(null);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [presetsPos]);

    return <>
        {savedFilters.length > 0 && (
            <button
                ref={presetsButtonRef}
                type="button"
                className={`btn btn-condensed btn-xs rounded-sm ${presetsPos
                  ? 'btn-primary'
                  : 'text-base-content/40 bg-[#efefef] dark:bg-gray-700'}`}
                onClick={handlePresetsClick}
                aria-label={presetsPos ? 'Hide presets' : 'Load saved preset'}
                aria-expanded={presetsPos !== null}
                title="Load preset"
            >
                <FaSliders size={12} aria-hidden="true" />
            </button>
        )}
        {presetsPos && (
            <div
                ref={presetsOverlayRef}
                style={{ position: 'fixed', top: presetsPos.top, left: presetsPos.left } as CSSProperties}
                className="z-50 bg-base-100 rounded-md shadow-lg border border-base-200 min-w-36 py-1"
                role="listbox"
                aria-label="Saved filter presets"
            >
                {savedFilters.map(preset => (
                    <button
                        key={preset.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-base-200 cursor-pointer"
                        onClick={() => {
                            onLoadFilter(preset);
                            setPresetsPos(null);
                        }}
                    >
                        {preset.name}
                    </button>
                ))}
                <hr className="border-base-200 my-1" />
                <button
                    type="button"
                    className="w-full text-left px-3 py-1 text-xs hover:bg-base-200 cursor-pointer text-base-content/60"
                    onClick={() => {
                        setPresetsPos(null);
                        setShowManageModal(true);
                    }}
                >
                    Manage…
                </button>
            </div>
        )}
        {showManageModal && (
            <SavedFiltersModal
                savedFilters={savedFilters}
                onRename={onRenameFilter}
                onDelete={onDeleteFilter}
                onDuplicate={onDuplicateFilter}
                onClose={() => setShowManageModal(false)}
            />
        )}
    </>;
};

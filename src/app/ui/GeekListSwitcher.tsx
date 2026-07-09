import { useEffect, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';

type GeekListEntry = {
    id: number;
    title: string;
};

type GeekListSwitcherProps = {
    activeId: number | null;
    lists: GeekListEntry[];
    onSelect: (id: number) => void;
};

export const GeekListSwitcher = ({ activeId, lists, onSelect }: GeekListSwitcherProps) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeTitle = lists.find(l => l.id === activeId)?.title ?? 'No geeklist loaded';

    useEffect(() => {
        if (!open) { return; }
        const handlePointerDown = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open]);

    return (
        <div ref={containerRef} className="relative w-fit max-w-[80%]">
            <button
                type="button"
                className="btn btn-xs btn-ghost rounded-md w-full flex items-center justify-between gap-1 px-2"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                title={activeTitle}
            >
                <span className="truncate text-xs text-base-content/70 w-fit">
                    {activeTitle}
                </span>
                <FaChevronDown
                    className={`shrink-0 w-2.5 h-2.5 text-base-content/40 transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>
            {open && (
                <ul
                    className="absolute top-full left-0 right-0 mt-0.5 z-50
                        bg-base-100 border border-base-content/20 rounded-md shadow-lg
                        py-1 overflow-y-auto max-h-48"
                    role="listbox"
                    aria-label="Select geeklist"
                >
                    {lists.map(gl => (
                        <li key={gl.id} role="option" aria-selected={gl.id === activeId}>
                            <button
                                type="button"
                                className={`w-full text-left px-3 py-1.5 text-xs truncate
                                    hover:bg-base-200 block
                                    ${gl.id === activeId
                                        ? 'text-primary font-semibold'
                                        : 'text-base-content'
                                    }`}
                                onClick={() => { onSelect(gl.id); setOpen(false); }}
                                title={gl.title}
                            >
                                {gl.title}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


import React, { CSSProperties, useEffect, useRef, useState } from 'react';

type ColorEntry = { name: string; css: string };

export const PlayColors: ColorEntry[] = [
    { name: 'Red', css: 'red' },
    { name: 'Yellow', css: 'yellow' },
    { name: 'Green', css: 'green' },
    { name: 'Blue', css: 'blue' },
    { name: 'White', css: 'white' },
    { name: 'Black', css: 'black' },
    { name: 'Gray', css: 'gray' },
    { name: 'Orange', css: 'orange' },
    { name: 'Purple', css: 'purple' },
    { name: 'Pink', css: 'pink' },
    { name: 'Tan', css: 'tan' },
    { name: 'Brown', css: 'brown' },
    { name: 'Lime', css: 'lime' },
    { name: 'Lavender', css: 'lavender' },
    { name: 'Navy', css: 'navy' },
    { name: 'Light Blue', css: 'lightblue' },
    { name: 'Olive', css: 'olive' },
    { name: 'Teal', css: 'teal' },
    { name: 'Silver', css: 'silver' },
    { name: 'Gold', css: 'gold' },
];

type ColorPickerProps = {
    value: string;
    onChange: (color: string) => void;
    rowRef: React.RefObject<HTMLDivElement | null>;
};

export const ColorPicker = ({ value, onChange, rowRef }: ColorPickerProps) => {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedColor = PlayColors.find(c => c.name === value);

    // Compute fixed dropdown position when opening
    useEffect(() => {
        if (!open || !buttonRef.current) {
            return;
        }
        const btnRect = buttonRef.current.getBoundingClientRect();
        const rowEl = rowRef.current;
        const rowRect = rowEl ? rowEl.getBoundingClientRect() : btnRect;
        setDropdownStyle({
            position: 'fixed',
            left: rowRect.left,
            width: rowRect.width,
            bottom: window.innerHeight - btnRect.top + 4,
        });
    }, [open, rowRef]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (colorName: string) => {
        onChange(colorName === value ? '' : colorName);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                type="button"
                className="w-7 h-6 rounded border border-base-300 overflow-hidden shrink-0"
                onClick={() => setOpen(prev => !prev)}
                title={selectedColor?.name ?? 'No color selected'}
                aria-label={`Color: ${selectedColor?.name ?? 'None'}`}
            >
                {selectedColor ? (
                    <div
                        className="w-full h-full"
                        style={{ backgroundColor: selectedColor.css }}
                    />
                ) : (
                    <div
                        className="w-full h-full relative"
                        style={{
                            opacity: 0.5,
                            background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
                        }}
                    >
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 56 22"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <line
                                x1="4" y1="18"
                                x2="52" y2="4"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="square"
                            />
                        </svg>
                    </div>
                )}
            </button>

            {open && (
                <div
                    className="z-9999 bg-base-100 border border-base-300 rounded-box shadow-lg p-1.5 grid grid-cols-5 gap-0.5"
                    style={dropdownStyle}
                >
                    {PlayColors.map(color => (
                        <button
                            key={color.name}
                            type="button"
                            title={color.name}
                            aria-label={color.name}
                            className={`h-6 w-full rounded cursor-pointer border-2 transition-transform hover:scale-110
                                ${value === color.name
                                    ? 'border-[#e07ca4]'
                                    : 'border-gray-300 border-[0.5px] hover:border-base-300'}`}
                            style={{ backgroundColor: color.css }}
                            onMouseDown={e => {
                                e.preventDefault();
                                handleSelect(color.name);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


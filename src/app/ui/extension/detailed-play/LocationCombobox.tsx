import React, { useEffect, useRef, useState } from 'react';

type LocationComboboxProps = {
    id: string;
    initialLocation: string;
    knownLocations: string[];
    addLocation: (location: string) => void;
    onChange: (location: string) => void;
};

/** Free-text location with suggestions from previously used locations. */
export const LocationCombobox = (props: LocationComboboxProps) => {
    const {
        id,
        initialLocation,
        knownLocations,
        addLocation,
        onChange,
    } = props;

    const [locationInput, setLocationInput] = useState<string>(initialLocation);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleChange = (value: string) => {
        setLocationInput(value);
        setDropdownOpen(true);
        onChange(value);
    };

    const handleSelect = (loc: string) => {
        setLocationInput(loc);
        setDropdownOpen(false);
        // new locations are added to the shared list, which flows back in as knownLocations
        if (!knownLocations.includes(loc)) {
            addLocation(loc);
        }
        onChange(loc);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (locationInput) {
                handleSelect(locationInput);
            }
        } else if (e.key === 'Escape') {
            setDropdownOpen(false);
        }
    };

    const filteredLocations = locationInput
        ? knownLocations.filter(l => l.toLowerCase().includes(locationInput.toLowerCase()))
        : knownLocations;

    return <div ref={containerRef} className="relative flex-1 min-w-0">
        {/* read by the add-play FormData */}
        <input type="hidden" name="location" value={locationInput} />
        <input
            id={id}
            type="text"
            value={locationInput}
            placeholder="Location"
            className="input input-xs text-xs w-full"
            onChange={e => handleChange(e.currentTarget.value)}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={handleKeyDown}
        />
        {dropdownOpen && filteredLocations.length > 0 && (
            <ul className={`absolute z-20 mt-0.5 w-full
                    bg-base-100 border border-base-300
                    rounded-box shadow-md
                    max-h-32 overflow-y-auto p-1`}>
                {filteredLocations.map(loc => (
                    <li key={loc}>
                        <button
                            type="button"
                            className="w-full text-left cursor-pointer px-2 py-0.5 rounded hover:bg-base-200"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSelect(loc)}
                        >
                            {loc}
                        </button>
                    </li>
                ))}
            </ul>
        )}
    </div>;
};

import { ModeSettingFormProps } from '@/app/lib/extension/types';
import { makeNonUserPlayer } from '@/app/lib/extension/utils';
import { usePlayData } from '@/app/lib/extension/PlayDataProvider';
import { type BggPlayer } from '@/app/lib/types/bgg';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaChevronDown, FaSpinner, FaUsers } from 'react-icons/fa6';

const TODAY = new Date().toISOString().split('T')[0];

type DurationOption = { label: string; value: string };

const DURATION_OPTIONS: DurationOption[] = [
    { label: '30 min', value: '30' },
    { label: '1 hr', value: '60' },
    { label: '2 hr', value: '120' },
    { label: '3 hr', value: '180' },
    { label: 'Other', value: 'other' },
];

export const DetailedPlayForm = ({
    formValues,
    setFormValues,
    addFn,
}: ModeSettingFormProps) => {
    const { players, locations: fetchedLocations, addLocation, addPlayer, searchPlayers } = usePlayData();

    const [locationOptions, setLocationOptions] = useState<string[]>(fetchedLocations);
    const [locationInput, setLocationInput] = useState<string>(formValues['location'] ?? '');
    const [locationDropdownOpen, setLocationDropdownOpen] = useState<boolean>(false);

    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [playersOpen, setPlayersOpen] = useState<boolean>(false);
    const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
    const [playerSearchResults, setPlayerSearchResults] = useState<Record<string, BggPlayer>>({});
    const [isSearchingPlayers, setIsSearchingPlayers] = useState<boolean>(false);

    const [duration, setDuration] = useState<string>(formValues['duration'] ?? '');
    const [customDuration, setCustomDuration] = useState<string>('');

    const locationRef = useRef<HTMLDivElement>(null);
    const playersRef = useRef<HTMLDivElement>(null);

    // Sync locationOptions when provider data arrives
    useEffect(() => {
        setLocationOptions(fetchedLocations);
    }, [fetchedLocations]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
                setLocationDropdownOpen(false);
            }
            if (playersRef.current && !playersRef.current.contains(e.target as Node)) {
                setPlayersOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLocationChange = (value: string) => {
        setLocationInput(value);
        setLocationDropdownOpen(true);
        setFormValues(Object.assign({}, formValues, { location: value }));
    };

    const handleLocationSelect = (loc: string) => {
        setLocationInput(loc);
        setLocationDropdownOpen(false);
        if (!locationOptions.includes(loc)) {
            setLocationOptions(prev => [...prev, loc]);
            addLocation(loc);
        }
        setFormValues(Object.assign({}, formValues, { location: loc }));
    };

    const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (locationInput) {
                handleLocationSelect(locationInput);
            }
        } else if (e.key === 'Escape') {
            setLocationDropdownOpen(false);
        }
    };

    const togglePlayer = useCallback((id: string) => {
        setSelectedPlayers(prev => {
            const next = prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id];
            const formPlayers = next.map(pid => players[pid] ?? makeNonUserPlayer(pid));
            setFormValues(Object.assign({}, formValues, { players: JSON.stringify(formPlayers) }));
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [players, formValues]);

    // Debounced player search
    useEffect(() => {
        if (playerSearchQuery.trim().length < 3) {
            setPlayerSearchResults({});
            setIsSearchingPlayers(false);
            return;
        }
        setIsSearchingPlayers(true);
        const timer = setTimeout(() => {
            searchPlayers(playerSearchQuery).then(results => {
                const resultMap = results.reduce((acc, p) => {
                    const id = p.username.length > 0 ? p.username : p.name;
                    acc[id] = p;
                    return acc;
                }, {} as Record<string, BggPlayer>);
                setPlayerSearchResults(resultMap);
                setIsSearchingPlayers(false);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [playerSearchQuery, searchPlayers]);

    const handlePlayerSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') {
            return;
        }
        e.preventDefault();
        const query = playerSearchQuery.trim();
        if (!query) {
            return;
        }
        // Add as new player if no exact name/username match exists in results
        const exactMatch = Object.values(playerSearchResults).find(
            p => p.name.toLowerCase() === query.toLowerCase() ||
                 p.username.toLowerCase() === query.toLowerCase(),
        );
        if (!exactMatch) {
            const newPlayer = makeNonUserPlayer(query);
            addPlayer(newPlayer);
            togglePlayer(query);
        }
        setPlayerSearchQuery('');
    };

    const selectSearchResult = (id: string, player: BggPlayer) => {
        addPlayer(player);
        togglePlayer(id);
    };

    const handleDurationChange = (value: string) => {
        setDuration(value);
        if (value !== 'other') {
            setFormValues(Object.assign({}, formValues, { duration: value }));
        }
    };

    const handleCustomDurationChange = (value: string) => {
        setCustomDuration(value);
        setFormValues(Object.assign({}, formValues, { duration: value }));
    };

    const filteredLocations = locationInput
        ? locationOptions.filter(l => l.toLowerCase().includes(locationInput.toLowerCase()))
        : locationOptions;

    const durationMinutes = duration === 'other' ? customDuration : duration;

    return (
        <form name="detailed" className="pb-2 flex flex-col gap-1.5 text-xs">
            {/* Hidden fields for FormData consumption in addPlay */}
            <input type="hidden" name="location" value={locationInput} />
            <input type="hidden" name="duration" value={durationMinutes} />
            <input type="hidden" name="players" value={selectedPlayers.join(',')} />

            {/* Date */}
            <div className="flex items-center gap-1.5">
                <label className="w-16 shrink-0">Date</label>
                <input
                    type="date"
                    name="playdate"
                    max={TODAY}
                    defaultValue={TODAY}
                    className="input input-xs text-xs flex-1 min-w-0"
                    onChange={e =>
                        setFormValues(Object.assign({}, formValues, { date: e.currentTarget.value }))
                    }
                />
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-1.5">
                <label className="w-16 shrink-0">Quantity</label>
                <input
                    type="number"
                    name="quantity"
                    min={1}
                    defaultValue={1}
                    className="input input-xs text-xs w-20"
                    onChange={e =>
                        setFormValues(Object.assign({}, formValues, { quantity: e.currentTarget.value }))
                    }
                />
            </div>

            {/* Location combobox */}
            <div className="flex items-center gap-1.5">
                <label className="w-16 shrink-0">Location</label>
                <div ref={locationRef} className="relative flex-1 min-w-0">
                    <input
                        type="text"
                        value={locationInput}
                        placeholder="Location"
                        className="input input-xs text-xs w-full"
                        onChange={e => handleLocationChange(e.currentTarget.value)}
                        onFocus={() => setLocationDropdownOpen(true)}
                        onKeyDown={handleLocationKeyDown}
                    />
                    {locationDropdownOpen && filteredLocations.length > 0 && (
                        <ul className={`absolute z-20 mt-0.5 w-full
                                        bg-base-100 border border-base-300
                                        rounded-box shadow-md
                                        max-h-32 overflow-y-auto p-1`}>
                            {filteredLocations.map(loc => (
                                <li
                                    key={loc}
                                    className="cursor-pointer px-2 py-0.5 rounded hover:bg-base-200"
                                    onMouseDown={e => { e.preventDefault(); handleLocationSelect(loc); }}
                                >
                                    {loc}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1.5">
                <label className="w-16 shrink-0">Duration</label>
                <select
                    className="select select-xs text-xs flex-1 min-w-0"
                    value={duration}
                    onChange={e => handleDurationChange(e.currentTarget.value)}
                >
                    <option value="">—</option>
                    {DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {duration === 'other' && (
                    <input
                        type="number"
                        min={1}
                        placeholder="min"
                        value={customDuration}
                        className="input input-xs text-xs w-16"
                        onChange={e => handleCustomDurationChange(e.currentTarget.value)}
                    />
                )}
            </div>

            {/* Incomplete */}
            <div className="flex items-center gap-1.5">
                <label className="w-16 shrink-0">Incomplete</label>
                <input
                    type="checkbox"
                    name="incomplete"
                    className="checkbox checkbox-xs checked:bg-[#e07ca4] checked:text-white"
                    onChange={e =>
                        setFormValues(Object.assign({}, formValues, {
                            incomplete: e.currentTarget.checked ? '1' : '',
                        }))
                    }
                />
            </div>

            {/* Players multi-select with search */}
            <div className="flex items-start gap-1.5">
                <label className="w-16 shrink-0 pt-0.5">Players</label>
                <div ref={playersRef} className="relative flex-1 min-w-0">
                    <button
                        type="button"
                        className="btn btn-xs w-full flex justify-between items-center gap-1"
                        onClick={() => setPlayersOpen(prev => !prev)}
                    >
                        <FaUsers className="w-3 h-3 shrink-0" />
                        <span className="truncate flex-1 text-left">
                            {selectedPlayers.length > 0
                                ? selectedPlayers.join(', ')
                                : 'Select players'}
                        </span>
                        <FaChevronDown className="w-2.5 h-2.5 shrink-0" />
                    </button>
                    {playersOpen && (
                        <div className={`absolute z-20 mt-0.5 w-full
                                        bg-base-100 border border-base-300
                                        rounded-box shadow-md p-1`}>
                            {/* Search input */}
                            <div className="flex items-center gap-1 mb-1 px-1">
                                <FaSearch className="w-2.5 h-2.5 shrink-0 text-base-content/50" />
                                <input
                                    type="text"
                                    value={playerSearchQuery}
                                    placeholder="Search players…"
                                    className="input input-xs text-xs flex-1 min-w-0"
                                    onChange={e => setPlayerSearchQuery(e.currentTarget.value)}
                                    onKeyDown={handlePlayerSearchKeyDown}
                                    autoFocus
                                />
                                {isSearchingPlayers && (
                                    <FaSpinner className="w-3 h-3 shrink-0 animate-spin text-base-content/50" />
                                )}
                            </div>
                            {/* Player list */}
                            <ul className="max-h-32 overflow-y-auto">
                                {(() => {
                                    const listEntries = playerSearchQuery.trim()
                                        ? Object.entries(playerSearchResults)
                                        : Object.entries(players);
                                    if (playerSearchQuery.trim() && !isSearchingPlayers && listEntries.length === 0) {
                                        return (
                                            <li className="px-2 py-1 text-base-content/50 italic">
                                                No results — press Enter to add &ldquo;{playerSearchQuery}&rdquo;
                                            </li>
                                        );
                                    }
                                    return listEntries.map(([id, player]) => {
                                        const label = player.name.length > 0
                                                      ? <div className="flex flex-col"><div>{player.name}</div>
                                                          {player.username
                                                              ? <div className="text-[0.5rem] text-gray-500">{player.username}</div>
                                                              : null}</div>
                                                      : player.username;
                                        const checked = selectedPlayers.includes(id);
                                        const isFromSearch = playerSearchQuery.trim().length > 0;
                                        return (
                                            <li
                                                key={id}
                                                className={`flex items-center gap-1.5 cursor-pointer
                                                            px-2 py-0.5 rounded hover:bg-base-200`}
                                                onMouseDown={e => {
                                                    e.preventDefault();
                                                    if (isFromSearch) {
                                                        selectSearchResult(id, player);
                                                    } else {
                                                        togglePlayer(id);
                                                    }
                                                    setPlayerSearchQuery('');
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    readOnly
                                                    checked={checked}
                                                    className="checkbox checkbox-xs pointer-events-none"
                                                />
                                                <span>{label}</span>
                                            </li>
                                        );
                                    });
                                })()}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

import { makeNonUserPlayer } from '@/app/lib/extension/utils';
import { type BggPlayer } from '@/app/lib/types/bgg';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaChevronDown, FaSpinner, FaUsers } from 'react-icons/fa6';

type PlayersMap = Record<string, BggPlayer>;

const SEARCH_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 300;

const playerId = (player: BggPlayer) => player.username.length > 0 ? player.username : player.name;

const PlayerLabel = ({ player }: { player: BggPlayer }): ReactNode => player.name.length > 0
    ? <div className="flex flex-col"><div>{player.name}</div>
        {player.username
         ? <div className="text-[0.5rem] text-gray-500">{player.username}</div>
         : null}</div>
    : player.username;

type PlayerPickerProps = {
    id: string;
    players: PlayersMap;
    selectedPlayers: string[];
    togglePlayer: (id: string) => void;
    addUpdatePlayer: (player: BggPlayer) => void;
    searchPlayers: (query: string) => Promise<BggPlayer[]>;
};

/** Button + dropdown to pick known players or search BGG users; Enter adds an unknown name as a new player. */
export const PlayerPicker = (props: PlayerPickerProps) => {
    const {
        id,
        players,
        selectedPlayers,
        togglePlayer,
        addUpdatePlayer,
        searchPlayers,
    } = props;

    const [open, setOpen] = useState<boolean>(false);
    const [query, setQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<PlayersMap>({});
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced player search
    useEffect(() => {
        if (query.trim().length < SEARCH_MIN_LENGTH) {
            setSearchResults({});
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(() => {
            searchPlayers(query).then(results => {
                const resultMap = results.reduce((acc, p) => {
                    acc[playerId(p)] = p;
                    return acc;
                }, {} as PlayersMap);
                setSearchResults(resultMap);
                setIsSearching(false);
            });
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query, searchPlayers]);

    const selectSearchResult = (resultId: string, player: BggPlayer) => {
        addUpdatePlayer(player);
        togglePlayer(resultId);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') {
            return;
        }
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            return;
        }
        // Add as new player if no exact name/username match exists in results
        const lower = trimmed.toLowerCase();
        const exactMatch = Object.values(searchResults).find(
            p => p.name.toLowerCase() === lower || p.username.toLowerCase() === lower,
        );
        if (exactMatch) {
            selectSearchResult(playerId(exactMatch), exactMatch);
        } else {
            addUpdatePlayer(makeNonUserPlayer(trimmed));
            togglePlayer(trimmed);
        }
        setQuery('');
    };

    const isSearchQuery = query.trim().length > 0;
    const listEntries = Object.entries(isSearchQuery ? searchResults : players);
    const selectedPlayerIds = new Set(selectedPlayers);

    const handleToggle = (entryId: string, player: BggPlayer) => {
        if (isSearchQuery) {
            selectSearchResult(entryId, player);
        } else {
            togglePlayer(entryId);
        }
        setQuery('');
    };

    let listContent: ReactNode = listEntries.map(([entryId, player]) => (
        <li key={entryId}>
            <label className={`flex items-center gap-1.5 cursor-pointer
                px-2 py-0.5 rounded hover:bg-base-200`}>
                <input
                    type="checkbox"
                    checked={selectedPlayerIds.has(entryId)}
                    className="checkbox checkbox-xs"
                    onChange={() => handleToggle(entryId, player)}
                />
                <span><PlayerLabel player={player} /></span>
            </label>
        </li>
    ));
    if (isSearchQuery && !isSearching && listEntries.length === 0) {
        listContent = <li className="px-2 py-1 text-base-content/50 italic">
            No results — press Enter to add &ldquo;{query}&rdquo;
        </li>;
    }

    return <div ref={containerRef} className="relative flex-1 min-w-0">
        <button
            id={id}
            type="button"
            aria-expanded={open}
            className="btn btn-xs w-full flex justify-between items-center gap-1 bg-white"
            onClick={() => setOpen(prev => !prev)}
        >
            <FaUsers className="w-3 h-3 shrink-0" />
            <span className="truncate flex-1 text-left">
                {selectedPlayers.length > 0 ? selectedPlayers.join(', ') : 'Select players'}
            </span>
            <FaChevronDown className="w-2.5 h-2.5 shrink-0" />
        </button>
        {open && (
            <div className={`absolute z-40 mt-0.5 w-full
                    bg-base-100 border border-base-300
                    rounded-box shadow-md p-1`}>
                <div className="flex items-center gap-1 mb-1 px-1">
                    <FaSearch className="w-2.5 h-2.5 shrink-0 text-base-content/50" />
                    <input
                        type="text"
                        value={query}
                        placeholder="Search players…"
                        className="input input-xs text-xs flex-1 min-w-0"
                        onChange={e => setQuery(e.currentTarget.value)}
                        onKeyDown={handleSearchKeyDown}
                        autoFocus
                    />
                    {isSearching && (
                        <FaSpinner className="w-3 h-3 shrink-0 animate-spin text-base-content/50" />
                    )}
                </div>
                <ul className="max-h-32 overflow-y-auto">
                    {listContent}
                </ul>
            </div>
        )}
    </div>;
};

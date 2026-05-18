'use client';

import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { DocumentMessageDetail } from '@/app/lib/extension/messageTypes';
import { useSync } from '@/app/lib/extension/useSync';
import { BggLocations, BggPlayer } from '@/app/lib/types/bgg';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type PlayDataContextValue = {
    players: Record<string, BggPlayer>;
    locations: string[];
    addLocation: (location: string) => void;
    addPlayer: (player: BggPlayer) => void;
    searchPlayers: (query: string) => Promise<BggPlayer[]>;
};

const PlayDataContext = createContext<PlayDataContextValue>({
    players: {},
    locations: [],
    addLocation: () => undefined,
    addPlayer: () => undefined,
    searchPlayers: () => Promise.resolve([]),
});

export const usePlayData = () => useContext(PlayDataContext);

export const PlayDataProvider = ({ children }: { children: ReactNode }) => {
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const { userId } = useSync();

    const [players, setPlayers] = useState<Record<string, BggPlayer>>({});
    const [locations, setLocations] = useState<string[]>([]);

    useEffect(() => {
        if (!userId) {
            return;
        }
        let active = true;

        const playersPromise = dispatchExtensionMessage({ userId, type: 'getPlayers' }) as
            Promise<{ response?: BggPlayer[] }> | undefined;

        const locationsPromise = dispatchExtensionMessage({ userId, type: 'getLocations' }) as
            Promise<{ response?: BggLocations }> | undefined;

        Promise.all([playersPromise, locationsPromise]).then(([playersResp, locationsResp]) => {
            if (!active) {
                return;
            }
            if (playersResp?.response) {
                setPlayers(playersResp.response.reduce((acc, player) => {
                    const id = player.username.length > 0 ? player.username : player.name;
                    acc[id] = player;
                    return acc;
                }, {} as Record<string, BggPlayer>));
            }
            if (locationsResp?.response?.locations) {
                setLocations(locationsResp.response.locations.map(l => l.location));
            }
        });

        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const addLocation = (location: string) => {
        setLocations(prev => prev.includes(location) ? prev : [...prev, location]);
    };

    const addPlayer = useCallback((player: BggPlayer) => {
        setPlayers(prev => {
            const id = player.username.length > 0 ? player.username : player.name;
            if (prev[id]) {
                return prev;
            }
            return Object.assign({}, prev, { [id]: player });
        });
    }, []);

    const searchPlayers = useCallback(async (query: string): Promise<BggPlayer[]> => {
        if (!query.trim()) {
            return [];
        }
        const promise = dispatchExtensionMessage(
            { type: 'searchPlayer', query } as Partial<DocumentMessageDetail>,
        ) as Promise<{ response?: BggPlayer[] }> | undefined;
        const result = await promise;
        return result?.response ?? [];
    }, [dispatchExtensionMessage]);

    return (
        <PlayDataContext.Provider value={{ players, locations, addLocation, addPlayer, searchPlayers }}>
            {children}
        </PlayDataContext.Provider>
    );
};

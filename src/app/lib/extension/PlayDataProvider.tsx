'use client';

import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { DocumentMessageDetail } from '@/app/lib/extension/messageTypes';
import { useSync } from '@/app/lib/extension/useSync';
import { BggLocations, BggPlayer, BggPlayerPlay } from '@/app/lib/types/bgg';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';

type PlayersMap = Record<string, BggPlayer>;
type PlayDataMap = Record<string, BggPlayerPlay>;

type PlayDataInitialData = {
    players: PlayersMap;
    locations: string[];
};

type PlayDataContextValue = {
    loaded: boolean;
    players: PlayersMap;
    playData: PlayDataMap;
    locations: string[];
    getInitialData: (active: boolean | undefined) => Promise<PlayDataInitialData>;
    addLocation: (location: string) => void;
    addUpdatePlayer: (player: BggPlayer) => void;
    addUpdatePlayData: (play: BggPlayerPlay) => void;
    clearPlayData: () => void;
    searchPlayers: (query: string) => Promise<BggPlayer[]>;
};

const emptyInitialData: PlayDataInitialData = { players: {}, locations: [] };

const PlayDataContext = createContext<PlayDataContextValue>({
    loaded: false,
    players: {},
    playData: {},
    locations: [],
    getInitialData: () => Promise.resolve(emptyInitialData),
    addLocation: () => undefined,
    addUpdatePlayer: () => undefined,
    addUpdatePlayData: () => undefined,
    clearPlayData: () => undefined,
    searchPlayers: () => Promise.resolve([]),
});

export const usePlayData = () => useContext(PlayDataContext);

export const PlayDataProvider = ({ children }: { children: ReactNode }) => {
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const { userId, syncOn } = useSync();
    const loadedRef = useRef<boolean>(false);

    const [players, setPlayers] = useState<Record<string, BggPlayer>>({});
    const [playData, setPlayData] = useState<Record<string, BggPlayerPlay>>({});
    const [locations, setLocations] = useState<string[]>([]);

    const getInitialData = async (active: boolean | undefined = true) => {
        const playersPromise = dispatchExtensionMessage({ userId, type: 'getPlayers' }) as
            Promise<{ response?: BggPlayer[] }> | undefined;

        const locationsPromise = dispatchExtensionMessage({ userId, type: 'getLocations' }) as
            Promise<{ response?: BggLocations }> | undefined;

        let players: PlayersMap = {} as PlayersMap;
        let locations: string[] = [];

        return Promise.all([playersPromise, locationsPromise]).then(([playersResp, locationsResp]) => {
            console.log('Loaded play data:', { playersResp, locationsResp });
            if (!active) {
                return emptyInitialData;
            }
            loadedRef.current = true;
            if (playersResp?.response) {
                players = playersResp.response.reduce((acc, player) => {
                    const id = player.username.length > 0 ? player.username : player.name;
                    acc[id] = player;
                    return acc;
                }, {} as Record<string, BggPlayer>);
                setPlayers(players);
            }
            if (locationsResp?.response?.locations) {
                locations = locationsResp.response.locations.map(l => l.location);
                setLocations(locations);
            }
            return { players, locations };
        }).catch(reason => {
            console.error('Error loading play data:', reason);
            return emptyInitialData;
        });
    };

    useEffect(() => {
        if (!(userId && syncOn) || loadedRef.current) {
            return;
        }
        let active = true;

        getInitialData(active).then();

        return () => {
            active = false;
            loadedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, syncOn]);

    const addLocation = (location: string) => {
        setLocations(prev => prev.includes(location) ? prev : [...prev, location]);
    };

    const addUpdatePlayer = useCallback((player: BggPlayer) => {
        setPlayers(prev => {
            const id = player.username.length > 0 ? player.username : player.name;
            return Object.assign({}, prev, { [id]: player });
        });
    }, []);

    const addUpdatePlayData = useCallback((play: BggPlayerPlay) => {
        setPlayData(prev => {
            const id = play.username.length > 0 ? play.username : play.name;
            return Object.assign({}, prev, { [id]: play });
        });
    }, []);

    const clearPlayData = useCallback(() => {
        setPlayData({});
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
        <PlayDataContext.Provider value={{
            loaded: loadedRef.current,
            players,
            playData,
            locations,
            getInitialData,
            addLocation,
            addUpdatePlayer,
            addUpdatePlayData,
            clearPlayData,
            searchPlayers
        }}>
            {children}
        </PlayDataContext.Provider>
    );
};

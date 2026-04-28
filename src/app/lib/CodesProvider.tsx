import {
    getScanned,
    removeScanned,
    setScanned,
} from '@/app/lib/database/database';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type Codes = string[];

const CodesContext =
    createContext<{
        codes: Codes;
        addHistoryID: (code: string, historyID: number) => void;
        getHistoryIDs: (code: string) => number[];
        setCodes: (codes: Codes | ((prev: Codes) => Codes)) => void;
        loaded: boolean;
    }>({
        codes: [],
        addHistoryID: () => undefined,
        getHistoryIDs: () => [],
        setCodes: () => undefined,
        loaded: false,
    });

type Props = {
    children: ReactNode;
};

export const useCodes = () =>
    useContext(CodesContext);

export const CodesProvider = ({ children }: Props) => {
    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const [codes, setCodesInner] = useState<Codes>([]);
    const [loaded, setLoaded] = useState(false);
    const historyIDsRef = useRef<Record<string, number[]>>({});

    const persistKey = username ? `${username.toLowerCase()}|codes` : undefined;
    const persistKeyRef = useRef(persistKey);
    persistKeyRef.current = persistKey;
    const codesRef = useRef(codes);
    codesRef.current = codes;

    const setCodes = useCallback((newCodes: Codes | ((prev: Codes) => Codes)) => {
        setCodesInner(prev => {
            const next = typeof newCodes === 'function' ? newCodes(prev) : newCodes;
            return [...next];
        });
    }, []);

    const addHistoryID = (code: string, historyID: number) => {
        const ids = historyIDsRef.current[code] ?? [];
        ids.push(historyID);
        historyIDsRef.current[code] = ids;
    };
    const getHistoryIDs = (code: string) => historyIDsRef.current[code] ?? [];

    // load persisted codes from db
    useEffect(() => {
        if (!persistKey) {
            setLoaded(true);
            return;
        }
        let active = true;
        (async () => {
            const stored = await getScanned(persistKey);
            if (!active) {
                return;
            }
            if (stored?.length && codesRef.current.length === 0) {
                setCodesInner([...stored]);
            }
            setLoaded(true);
        })();
        return () => { active = false; };
    }, [persistKey]);

    // persist codes to db on change
    useEffect(() => {
        if (!loaded || !persistKeyRef.current) {
            return;
        }
        if (codes.length === 0) {
            removeScanned(persistKeyRef.current).then();
        } else {
            setScanned(persistKeyRef.current, codes).then();
        }
    }, [codes, loaded]);

    return <CodesContext.Provider value={{ codes, addHistoryID, getHistoryIDs, setCodes, loaded }}>
        {children}
    </CodesContext.Provider>;
};

import { useCallback, useSyncExternalStore } from 'react';

// same-tab writes don't fire `storage` events, so notify subscribers directly
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
};

const readStored = (key: string) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

/**
 * One of a fixed set of string values, persisted in localStorage.
 *
 * The server render and hydration use `fallback`; the stored value takes over right
 * after hydration, so server and client HTML always match.
 */
export const useStoredChoice = <T extends string>(key: string, choices: readonly T[], fallback: T) => {
    const getSnapshot = () => {
        const stored = readStored(key);
        return choices.includes(stored as T) ? stored as T : fallback;
    };

    const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

    const setValue = useCallback((next: T) => {
        try {
            localStorage.setItem(key, next);
        } catch {
            // storage unavailable (e.g. blocked): the choice just isn't remembered
        }
        listeners.forEach(listener => listener());
    }, [key]);

    return [value, setValue] as const;
};

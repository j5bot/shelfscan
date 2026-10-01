import { createContext } from 'react';

export type SyncContextValue = {
    syncOn: boolean;
    hasSubscription: boolean | undefined;
    userId: string | undefined;
    currentUsername: string | undefined;
    extensionUser: string | undefined;
};

export const SyncContext = createContext<SyncContextValue>({} as SyncContextValue);

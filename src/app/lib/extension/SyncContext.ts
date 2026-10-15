import { ExtensionVersion } from '@/app/lib/utils/extensionVersion';
import { createContext } from 'react';

export type SyncContextValue = {
    syncOn: boolean;
    // false until the first check for the extension has run
    syncChecked: boolean;
    // the installed extension's version; null until found, or without the extension
    extensionVersion: ExtensionVersion | null;
    hasSubscription: boolean | undefined;
    userId: string | undefined;
    currentUsername: string | undefined;
    extensionUser: string | undefined;
};

export const SyncContext = createContext<SyncContextValue>({} as SyncContextValue);

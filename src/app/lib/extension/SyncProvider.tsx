import { SyncContext } from '@/app/lib/extension/SyncContext';
import { useExtensionPresence } from '@/app/lib/extension/syncHooks/useExtensionPresence';
import { useExtensionSubscription } from '@/app/lib/extension/syncHooks/useExtensionSubscription';
import { useExtensionUser } from '@/app/lib/extension/syncHooks/useExtensionUser';
import { useExtensionVersion } from '@/app/lib/extension/syncHooks/useExtensionVersion';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import posthog from 'posthog-js';
import { ReactNode, useMemo } from 'react';

export const SyncProvider = ({ children }: { children: ReactNode }) => {
    const syncOn = useExtensionPresence();
    const hasSubscription = useExtensionSubscription();
    const extensionUser = useExtensionUser();
    const extensionVersion = useExtensionVersion(syncOn);

    const userId = useSelector(
        (state: RootState) => state.bgg.user?.id,
    );

    const currentUsername = useSelector(
        (state: RootState) => state.bgg.user?.user,
    );

    const value = useMemo(() => {
        if (userId && currentUsername && syncOn !== null && hasSubscription !== undefined) {
            posthog.capture('extension-check', {
                extension: syncOn,
                subscription: hasSubscription,
            });
        }
        return {
            syncOn: !!syncOn,
            syncChecked: syncOn !== null,
            extensionVersion,
            hasSubscription,
            userId,
            currentUsername,
            extensionUser,
        };
    }, [syncOn, extensionVersion, hasSubscription, userId, currentUsername, extensionUser]);

    return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

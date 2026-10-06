import { SyncContextValue } from '@/app/lib/extension/SyncContext';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';

/** BGG usernames are case-insensitive; with no username reported by the extension there is nothing to mismatch. */
export const extensionUserMatches = (currentUsername?: string, extensionUser?: string) =>
    !extensionUser || currentUsername?.toLowerCase() === extensionUser.toLowerCase();

/** The first reason, in the order a user would fix them, that the extension tools can't run. */
const getUnavailableMessage = (sync: SyncContextValue) => {
    const { syncOn, hasSubscription, userId, currentUsername, extensionUser } = sync;
    switch (true) {
        case !syncOn:
            return 'Unavailable: the ShelfScan browser extension is not installed or not detected on this page. '
                   + 'Install the extension and reload ShelfScan to use this tool.';
        case hasSubscription === undefined:
            return 'Unavailable: ShelfScan is still checking for a ShelfScan extension subscription. '
                   + 'Try again in a moment.';
        case !hasSubscription:
            return 'Unavailable: this tool requires a ShelfScan extension subscription, and none was found.';
        case !(userId && currentUsername):
            return 'Unavailable: no BGG user is loaded in ShelfScan. Load the user\'s collection with '
                   + 'load_bgg_collection first.';
        case !extensionUserMatches(currentUsername, extensionUser):
            return `Unavailable: the ShelfScan extension is logged in to BGG as "${extensionUser}", but the user `
                   + `loaded in ShelfScan is "${currentUsername}". Nothing was changed. Either load `
                   + `"${extensionUser}" with load_bgg_collection, or log in to BGG as "${currentUsername}" `
                   + 'in this browser.';
    }
    return undefined;
};

/** Derives the extension tools' access from the sync state: the user when they can run, otherwise why not. */
export const getExtensionToolAccess = (sync: SyncContextValue): ExtensionToolAccess => {
    const unavailableMessage = getUnavailableMessage(sync);
    if (unavailableMessage) {
        return { canUseExtension: false, unavailableMessage };
    }
    return { canUseExtension: true, userId: sync.userId, username: sync.currentUsername };
};

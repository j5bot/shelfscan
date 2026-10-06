/** Whether the extension WebMCP tools can run, and for which BGG user. */
export type ExtensionToolAccess = {
    /** The active ShelfScan BGG user id; only set when `canUseExtension` */
    userId?: string;
    /** The active ShelfScan BGG username; only set when `canUseExtension` */
    username?: string;
    canUseExtension: boolean;
    /** Why the tools can't run, for the unavailable stand-in; only set when not `canUseExtension` */
    unavailableMessage?: string;
};

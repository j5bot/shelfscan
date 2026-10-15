import { Modes, ModeSettings } from '@/app/lib/extension/types';

export const DEFAULT_MODES: Modes = { collection: 'add', play: 'quick', tags: 'choose' };

// used when stored modes predate the collection mode
const FALLBACK_STORED_MODES: Modes = { collection: 'add', play: 'quick', tags: 'wishlist' };

/** The modes to use from the stored `extensionModes` setting. */
export const resolveStoredModes = (stored: Modes | undefined): Modes =>
    stored?.collection ? stored : FALLBACK_STORED_MODES;

export type ResolveModeParams = {
    modeKey: keyof Modes;
    modeSettings: ModeSettings;
    // the mode chosen by the user
    selectedMode: Modes[keyof Modes];
    defaultMode: Modes[keyof Modes];
    update: boolean;
};

/**
 * The mode to show for a mode block: the selected mode if it's allowed (update-only modes need an item to update),
 * else the default; and whether its action is disabled (adding a new item can't be 'previous' or 'clear').
 */
export const resolveMode = (params: ResolveModeParams) => {
    const { modeKey, modeSettings, selectedMode, defaultMode, update } = params;

    const allowedModes = Object.entries(modeSettings)
        .filter(([, setting]) => update || !setting.updateOnly)
        .map(([mode]) => mode);
    const currentMode = allowedModes.includes(selectedMode) ? selectedMode : defaultMode;

    return {
        currentMode,
        modeSetting: modeSettings[currentMode],
        isDisabled: modeKey === 'collection' && !update && ['previous', 'clear'].includes(currentMode),
    };
};

export type ExtensionSectionsParams = {
    isEnabled: boolean;
    addOnly: boolean;
    view: 'version' | 'collection';
    collectionId: number | undefined;
};

/**
 * Which extension sections to show. Add-only shows just the add-to-collection block; in the collection view, a
 * game that isn't in the collection (a BGG search result) has nothing to tag or update.
 */
export const getExtensionSections = (params: ExtensionSectionsParams) => {
    const { isEnabled, addOnly, view, collectionId } = params;
    const notInCollectionView = view === 'collection' && !collectionId;

    return {
        primary: isEnabled,
        addOnly,
        tags: !notInCollectionView,
        settings: isEnabled && !addOnly && !notInCollectionView,
        secondary: isEnabled && !addOnly,
    };
};

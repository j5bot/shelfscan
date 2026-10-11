import { getSetting, setSetting } from '@/app/lib/database/database';
import { Modes } from '@/app/lib/extension/types';
import { DEFAULT_MODES, resolveStoredModes } from '@/app/lib/utils/extensionModes';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';

/** Closes the mode picker collapse the event came from. */
const closeModeCollapse = (event: SyntheticEvent<HTMLElement> | undefined) => {
    const collapseKey = event?.currentTarget.parentElement?.getAttribute('data-collapse-key');
    if (!collapseKey) {
        return;
    }
    const collapse = document.querySelector(`[data-collapse=${collapseKey}]`);
    (collapse?.querySelector('input[type=checkbox]') as HTMLInputElement | null)?.click();
};

/** The extension action modes (collection, play, tags), loaded from and saved to the `extensionModes` setting. */
export const useExtensionModes = () => {
    const [modes, setModes] = useState<Modes>(DEFAULT_MODES);

    useEffect(() => {
        let active = true;
        getSetting('extensionModes').then(stored => {
            if (active) {
                setModes(resolveStoredModes(stored as Modes | undefined));
            }
        });
        return () => {
            active = false;
        };
    }, []);

    const updateModes = useCallback(async (event: SyntheticEvent<HTMLElement> | undefined, nextModes: Modes) => {
        closeModeCollapse(event);
        await setSetting('extensionModes', nextModes);
        setModes(nextModes);
    }, []);

    return { modes, updateModes };
};

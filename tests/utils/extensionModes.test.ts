import { describe, it, expect } from '../setup';
import { ModeSettings } from '@/app/lib/extension/types';
import {
    DEFAULT_MODES,
    getExtensionSections,
    resolveMode,
    resolveStoredModes,
} from '@/app/lib/utils/extensionModes';

const setting = (updateOnly = false) => ({ label: '', icon: null, width: '', updateOnly });
const collectionSettings = {
    add: setting(),
    trade: setting(),
    previous: setting(),
    clear: setting(),
    wishlist: setting(),
    sell: setting(),
    info: setting(true),
} as unknown as ModeSettings;

describe('resolveStoredModes', () => {
    it('uses the stored modes when they have a collection mode', () => {
        const stored = { collection: 'trade', play: 'detailed', tags: 'hasparts' } as const;
        expect(resolveStoredModes(stored)).toBe(stored);
    });

    it('falls back without stored modes, or without a collection mode', () => {
        const fallback = { collection: 'add', play: 'quick', tags: 'wishlist' };
        expect(resolveStoredModes(undefined)).toEqual(fallback);
        expect(resolveStoredModes({ play: 'quick' } as never)).toEqual(fallback);
    });

    it('defaults before anything is loaded', () => {
        expect(DEFAULT_MODES).toEqual({ collection: 'add', play: 'quick', tags: 'choose' });
    });
});

describe('resolveMode', () => {
    const params = {
        modeKey: 'collection' as const,
        modeSettings: collectionSettings,
        defaultMode: 'add' as const,
    };

    it('keeps the selected mode when it is allowed', () => {
        const { currentMode, modeSetting } = resolveMode({ ...params, selectedMode: 'trade', update: false });
        expect(currentMode).toBe('trade');
        expect(modeSetting).toBe(collectionSettings.trade);
    });

    it('falls back to the default for an update-only mode without an item to update', () => {
        expect(resolveMode({ ...params, selectedMode: 'info', update: false }).currentMode).toBe('add');
        expect(resolveMode({ ...params, selectedMode: 'info', update: true }).currentMode).toBe('info');
    });

    it("disables 'previous' and 'clear' when adding a new item", () => {
        expect(resolveMode({ ...params, selectedMode: 'previous', update: false }).isDisabled).toBe(true);
        expect(resolveMode({ ...params, selectedMode: 'clear', update: false }).isDisabled).toBe(true);
        expect(resolveMode({ ...params, selectedMode: 'clear', update: true }).isDisabled).toBe(false);
        expect(resolveMode({ ...params, selectedMode: 'add', update: false }).isDisabled).toBe(false);
    });

    it("only disables collection modes", () => {
        const playSettings = { quick: setting(), detailed: setting() } as unknown as ModeSettings;
        const resolved = resolveMode({
            modeKey: 'play',
            modeSettings: playSettings,
            defaultMode: 'quick',
            selectedMode: 'detailed',
            update: false,
        });
        expect(resolved.currentMode).toBe('detailed');
        expect(resolved.isDisabled).toBe(false);
    });
});

describe('getExtensionSections', () => {
    const base = { isEnabled: true, addOnly: false, view: 'collection' as const, collectionId: 5 };

    it('shows everything for a collection item', () => {
        expect(getExtensionSections(base)).toEqual({
            primary: true,
            addOnly: false,
            tags: true,
            settings: true,
            secondary: true,
        });
    });

    it('hides tags and the update toggle for a game not in the collection, in the collection view', () => {
        const sections = getExtensionSections({ ...base, collectionId: undefined });
        expect(sections.tags).toBe(false);
        expect(sections.settings).toBe(false);
        expect(sections.secondary).toBe(true);
    });

    it('keeps tags and the toggle outside the collection view', () => {
        const sections = getExtensionSections({ ...base, view: 'version', collectionId: undefined });
        expect(sections.tags).toBe(true);
        expect(sections.settings).toBe(true);
    });

    it('hides the toggle and data forms when add-only', () => {
        const sections = getExtensionSections({ ...base, addOnly: true });
        expect(sections.addOnly).toBe(true);
        expect(sections.settings).toBe(false);
        expect(sections.secondary).toBe(false);
    });

    it('shows nothing when the extension is not usable', () => {
        const sections = getExtensionSections({ ...base, isEnabled: false });
        expect(sections.primary).toBe(false);
        expect(sections.settings).toBe(false);
        expect(sections.secondary).toBe(false);
    });
});

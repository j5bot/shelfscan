import { describe, it, expect, beforeEach } from '../setup.js';
import { vi } from 'vitest';

// vi.mock is hoisted before imports, so the mock is in place when plugins.ts loads
vi.mock('@/app/lib/database/database', () => ({
    database: {
        settings: {
            get: vi.fn(),
            put: vi.fn().mockResolvedValue(undefined),
            add: vi.fn().mockResolvedValue(undefined),
        },
        plugins: {
            get: vi.fn(),
            put: vi.fn().mockResolvedValue(undefined),
            add: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockResolvedValue(undefined),
        },
    },
    getSetting: vi.fn(),
    getPlugin: vi.fn(),
    setCollection: vi.fn().mockResolvedValue(undefined),
}));

import { getSetting, getPlugin, database } from '@/app/lib/database/database';
import {
    getPluginIdList,
    getEnabledOrDisabledPlugins,
    makePluginMap,
    enableOrDisablePlugin,
    addPlugin,
    removePlugin,
} from '@/app/lib/plugins/plugins';
import type { ShelfScanPlugin } from '@/app/lib/types/plugins';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns getSetting mock that resolves with the given map per key */
const mockSettings = (map: Record<string, string[] | undefined> = {}) => {
    vi.mocked(getSetting).mockImplementation((key: string) =>
        Promise.resolve(map[key]),
    );
};

const makeCustomPlugin = (id: string): ShelfScanPlugin => ({
    id,
    name: `Custom Plugin ${id}`,
    type: 'link',
    location: 'actions',
    templates: { game: [], version: [] },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('plugins', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    // getPluginIdList
    // -----------------------------------------------------------------------

    describe('#getPluginIdList', () => {
        it('returns the built-in BGGLink plugin id when no user settings are configured', async () => {
            mockSettings();
            const list = await getPluginIdList(true);
            expect(list).toContain('plugin.internal.BGGLink');
        });

        it('returns disabled built-in plugin ids when enabled=false', async () => {
            mockSettings();
            const list = await getPluginIdList(false);
            expect(list).toContain('plugin.internal.BGGMarket');
            expect(list).toContain('plugin.internal.BoardGameStats');
        });

        it('does not include enabled built-in plugins in the disabled list', async () => {
            mockSettings();
            const list = await getPluginIdList(false);
            expect(list).not.toContain('plugin.internal.BGGLink');
        });

        it('includes a user-added plugin id in the enabled list', async () => {
            mockSettings({ plugins: ['user.plugin.1'] });
            const list = await getPluginIdList(true);
            expect(list).toContain('user.plugin.1');
        });

        it('excludes a built-in plugin that the user has explicitly disabled', async () => {
            mockSettings({ disabledPlugins: ['plugin.internal.BGGLink'] });
            const list = await getPluginIdList(true);
            expect(list).not.toContain('plugin.internal.BGGLink');
        });

        it('places an explicitly disabled built-in plugin into the disabled list', async () => {
            mockSettings({ disabledPlugins: ['plugin.internal.BGGLink'] });
            const list = await getPluginIdList(false);
            expect(list).toContain('plugin.internal.BGGLink');
        });
    });

    // -----------------------------------------------------------------------
    // getEnabledOrDisabledPlugins
    // -----------------------------------------------------------------------

    describe('#getEnabledOrDisabledPlugins', () => {
        it('returns the built-in BGGLink plugin object when enabled=true', async () => {
            mockSettings();
            const plugins = await getEnabledOrDisabledPlugins(true);
            const bggLink = plugins.find(p => p.id === 'plugin.internal.BGGLink');
            expect(bggLink).toBeDefined();
            expect(bggLink?.type).toBe('link');
        });

        it('returns the built-in BGGMarket plugin object when enabled=false', async () => {
            mockSettings();
            const plugins = await getEnabledOrDisabledPlugins(false);
            const market = plugins.find(p => p.id === 'plugin.internal.BGGMarket');
            expect(market).toBeDefined();
        });

        it('calls getPlugin for a user-added plugin id', async () => {
            const customPlugin = makeCustomPlugin('user.plugin.1');
            mockSettings({ plugins: ['user.plugin.1'] });
            vi.mocked(getPlugin).mockResolvedValue(customPlugin);

            await getEnabledOrDisabledPlugins(true);
            expect(getPlugin).toHaveBeenCalledWith('user.plugin.1');
        });

        it('includes the resolved user plugin in the returned list', async () => {
            const customPlugin = makeCustomPlugin('user.plugin.2');
            mockSettings({ plugins: ['user.plugin.2'] });
            vi.mocked(getPlugin).mockResolvedValue(customPlugin);

            const plugins = await getEnabledOrDisabledPlugins(true);
            expect(plugins.find(p => p.id === 'user.plugin.2')).toBeDefined();
        });

        it('filters out plugins that resolved to undefined', async () => {
            mockSettings({ plugins: ['ghost.plugin'] });
            vi.mocked(getPlugin).mockResolvedValue(undefined);

            const plugins = await getEnabledOrDisabledPlugins(true);
            expect(plugins.find(p => p.id === 'ghost.plugin')).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // makePluginMap
    // -----------------------------------------------------------------------

    describe('#makePluginMap', () => {
        it('returns a map with a link.details.game entry for the BGGLink plugin', async () => {
            mockSettings();
            const map = await makePluginMap();
            expect(map.link).toBeDefined();
            expect(map.link.details).toBeDefined();
            expect(Array.isArray(map.link.details.game)).toBe(true);
            expect(map.link.details.game.length).toBeGreaterThan(0);
        });

        it('returns an empty map when all plugins are disabled', async () => {
            // Disable all built-in plugins
            mockSettings({
                disabledPlugins: [
                    'plugin.internal.BGGLink',
                    'plugin.internal.BGGMarket',
                    'plugin.internal.BoardGameStats',
                ],
            });
            const map = await makePluginMap();
            // No link.details.game entries because BGGLink is disabled
            expect(map.link?.details?.game ?? []).toHaveLength(0);
        });

        it('merges templates from multiple plugins at the same location', async () => {
            // Enable an additional user plugin that also sits at link.details
            const extraPlugin: ShelfScanPlugin = {
                id: 'extra.link.plugin',
                type: 'link',
                location: 'details',
                templates: {
                    game: [{ icon: 'fa/FaPlus', title: 'Extra', template: '{{page_url}}' }],
                    version: [],
                },
            };
            mockSettings({ plugins: ['extra.link.plugin'] });
            vi.mocked(getPlugin).mockResolvedValue(extraPlugin);

            const map = await makePluginMap();
            // Should have BGGLink's template + extraPlugin's template
            expect(map.link.details.game.length).toBeGreaterThanOrEqual(2);
        });
    });

    // -----------------------------------------------------------------------
    // enableOrDisablePlugin
    // -----------------------------------------------------------------------

    describe('#enableOrDisablePlugin', () => {
        it('removes the plugin from disabledPlugins when enabling', async () => {
            vi.mocked(database.settings.get).mockResolvedValue({
                id: 'disabledPlugins',
                value: ['plugin.internal.BGGLink'],
            });
            await enableOrDisablePlugin('plugin.internal.BGGLink', true);
            expect(database.settings.put).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'disabledPlugins',
                    value: expect.not.arrayContaining(['plugin.internal.BGGLink']),
                }),
            );
        });

        it('does not add a built-in plugin back to the plugins list when enabling', async () => {
            vi.mocked(database.settings.get).mockResolvedValue({
                id: 'disabledPlugins',
                value: [],
            });
            await enableOrDisablePlugin('plugin.internal.BGGLink', true);
            // Because it's a built-in, enableOrDisablePlugin returns early after removing
            // it from disabledPlugins — database.settings.get should only be called once
            expect(database.settings.get).toHaveBeenCalledTimes(1);
        });

        it('moves a non-built-in plugin to disabledPlugins when disabling', async () => {
            vi.mocked(database.settings.get)
                .mockResolvedValueOnce({ id: 'plugins', value: ['user.plugin.x'] })
                .mockResolvedValueOnce({ id: 'disabledPlugins', value: [] });

            await enableOrDisablePlugin('user.plugin.x', false);
            expect(database.settings.put).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'disabledPlugins',
                    value: expect.arrayContaining(['user.plugin.x']),
                }),
            );
        });
    });

    // -----------------------------------------------------------------------
    // addPlugin
    // -----------------------------------------------------------------------

    describe('#addPlugin', () => {
        it('calls database.plugins.put when the plugin already exists', async () => {
            const plugin = makeCustomPlugin('user.new.plugin');
            vi.mocked(database.settings.get).mockResolvedValue({
                id: 'disabledPlugins',
                value: [],
            });
            vi.mocked(database.plugins.get).mockResolvedValue(plugin);

            await addPlugin(JSON.stringify(plugin));
            expect(database.plugins.put).toHaveBeenCalledWith(plugin);
        });

        it('calls database.plugins.add when the plugin does not yet exist', async () => {
            const plugin = makeCustomPlugin('user.brand.new.plugin');
            vi.mocked(database.settings.get).mockResolvedValue({
                id: 'disabledPlugins',
                value: [],
            });
            vi.mocked(database.plugins.get).mockResolvedValue(undefined);

            await addPlugin(JSON.stringify(plugin));
            expect(database.plugins.add).toHaveBeenCalledWith(plugin);
        });
    });

    // -----------------------------------------------------------------------
    // removePlugin
    // -----------------------------------------------------------------------

    describe('#removePlugin', () => {
        it('removes the plugin id from the plugins list setting', async () => {
            vi.mocked(database.settings.get).mockResolvedValue({
                id: 'plugins',
                value: ['user.removable.plugin'],
            });

            await removePlugin('user.removable.plugin');
            expect(database.settings.put).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'plugins',
                    value: expect.not.arrayContaining(['user.removable.plugin']),
                }),
            );
        });

        it('calls database.plugins.delete with the plugin id', async () => {
            vi.mocked(database.settings.get).mockResolvedValue({
                id: 'plugins',
                value: [],
            });

            await removePlugin('user.to.delete');
            expect(database.plugins.delete).toHaveBeenCalledWith('user.to.delete');
        });
    });
});

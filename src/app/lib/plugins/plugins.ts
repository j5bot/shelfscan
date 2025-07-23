import { database, getPlugin, getSetting } from '@/app/lib/database/database';
import { ShelfScanPlugin, ShelfScanPluginMap, TemplateType } from '@/app/lib/types/plugins';

const builtInPlugins: ShelfScanPlugin[] = [
    {
        id: 'plugin.internal.BGGLink',
        name: 'BGG Links Plugin',
        type: 'link',
        location: 'details',
        templates: {
            game: [
                {
                    icon: 'fa/FaExternalLinkAlt',
                    title: 'Game Link',
                    template: '{{page_url}}',
                },
            ],
            version: [
                {
                    icon: 'fa/FaExternalLinkAlt',
                    title: 'Version Link',
                    template: '{{page_url}}',
                },
            ],
        }
    },
    {
        id: 'plugin.external.BoardGameStats',
        name: 'Board Game Stats Log Play Plugin',
        type: 'link',
        location: 'actions',
        templates: {
            game: [
                {
                    icon: '0 0 225 225/M34 193h162c-1.648-9.099-10.093-15.351-17-20.789-13.515-10.643-30.19-20.001-37.691-36.211-3.905-8.44-6.149-17.82-7.439-27-.469-3.332-1.653-7.538-.267-10.79 1.991-4.67 8.371-7.816 11.292-12.21 8.172-12.292 8.553-29.676.255-41.96C129.841 21.374 92.583 23.996 83.363 51 79.27 62.983 80.3 76.557 87.789 87c2.777 3.874 8.869 6.894 10.593 11.21 1.281 3.205-.34 7.579-.982 10.79-1.944 9.718-4.194 19.076-8.67 28-7.72 15.389-23.633 24.881-36.73 35.211-7.035 5.548-15.094 12.027-18 20.789Z',
                    iconSize: 15,
                    title: 'Log Play',
                    template: 'https://app.bgstatsapp.com/addPlay.html?gameId={{id}}',
                    className: 'min-w-29'
                }
            ],
            version: []
        }
    }
];

const builtInPluginIds = builtInPlugins.map(plugin => plugin.id);

export const addPlugin = async (pluginJSON: string) => {
    const plugin = JSON.parse(pluginJSON);
    const id = plugin.id;

    const pluginListSetting = await database.settings.get('plugins');
    if (!pluginListSetting) {
        await database.settings.add({ id: 'plugins', value: [id] });
    } else {
        await database.settings.put({ id: 'plugins', value: [...(pluginListSetting.value as string[]), id] });
    }
    try {
        await database.plugins.add(plugin);
    } catch (e) {
        void e;
        await database.plugins.put(plugin);
    }
};

export const enableOrDisablePlugin = async (id: string, enable: boolean = true) => {
    const fromList = enable ? 'disabledPlugins' : 'plugins';
    const toList = enable ? 'plugins' : 'disabledPlugins';
    const fromListSetting = (await database.settings.get(fromList)) ?? { id: 'plugins', value: [] };
    await database.settings.put({
        id: fromList, value: (fromListSetting.value as string[])
            .filter((plugin: string) => plugin !== id)
    });
    const toListSetting = (await database.settings.get(toList)) ?? { id: 'disabledPlugins', value: [] };
    if (toListSetting) {
        await database.settings.put({
            id: toList, value: [...toListSetting.value as string[], id]
        });
    } else {
        await database.settings.add({
            id: toList, value: [id]
        });
    }
};

export const removePlugin = async (id: string) => {
    const pluginListSetting = (await database.settings.get('plugins')) ?? { id: 'plugins', value: [] };
    await database.settings.put({
        id: 'plugins', value: (pluginListSetting.value as string[])
            .filter((plugin: string) => plugin !== id)
    });
    try {
        await database.plugins.delete(id);
    } catch (e) {
        console.error('error removing plugin', id, e);
    }
};

export const getEnabledOrDisabledPlugins = async (enabled: boolean = true): Promise<ShelfScanPlugin[]> => {
    let pluginList = (
           await getSetting(enabled ? 'plugins' : 'disabledPlugins') as string[]
       ) ?? [];
    pluginList = enabled ? builtInPluginIds.concat(pluginList) : pluginList;
    return (
        await Promise
            .all(
                pluginList.map(pluginId =>
                    builtInPluginIds.includes(pluginId) ?
                    Promise.resolve(builtInPlugins.find(plugin => plugin.id === pluginId)) :
                    getPlugin(pluginId))
            )
    ).filter((x: unknown) => x) as ShelfScanPlugin[];
};

export const makeEnabledOrDisabledPluginList =
    async (enabled: boolean = true) => await getEnabledOrDisabledPlugins(enabled);

export const makePluginMap = async () => {
    const disabledPlugins = await getSetting('disabledPlugins') as string[];
    return (await makeEnabledOrDisabledPluginList(true)).reduce((acc, plugin) => {
        if (!plugin) {
            return acc;
        }
        // force disabled, such as for built-in plugins which are always in the plugin list
        if (disabledPlugins?.includes(plugin.id)) {
            return acc;
        }
        const type = acc[plugin.type] ?? {};
        const location = type[plugin.location] ?? {};
        const templateEntries = Object.entries(plugin.templates);
        templateEntries.forEach(([templateType, templatesValue]) => {
            const templates = location[templateType as TemplateType] ?? [];
            Object.assign(location, {
                [templateType]: templates.concat(templatesValue)
            });
        });
        Object.assign(type, { [plugin.location]: location });
        Object.assign(acc, { [plugin.type]: type });
        return acc;
    }, {} as ShelfScanPluginMap)
};

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
];

export const addPlugin = async (pluginJSON: string) => {
    const plugin = JSON.parse(pluginJSON);
    const id = plugin.id;

    const pluginListSetting = await database.settings.get('plugins');
    if (!pluginListSetting) {
        await database.settings.add({ id: 'plugins', value: [id] });
    } else {
        await database.settings.put({ id: 'plugins', value: [...pluginListSetting.value, id] });
    }
    try {
        await database.plugins.add(plugin);
    } catch (e) {
        await database.plugins.put(plugin);
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

export const getEnabledPlugins = async (): Promise<ShelfScanPlugin[]> => {
    const pluginList = (
                           await getSetting('plugins') as string[]
                       ) ?? [];
    return (
        await Promise
            .all(
                pluginList.map(pluginId => getPlugin(pluginId))
            )
    ).filter((x: unknown) => x) as ShelfScanPlugin[];
};

export const makePluginList = async () =>
    builtInPlugins.concat(await getEnabledPlugins());

export const makePluginMap = async () => {
    return (await makePluginList()).reduce((acc, plugin) => {
        if (!plugin) {
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

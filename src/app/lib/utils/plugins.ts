import { getEnabledPlugins } from '@/app/lib/database/database';
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

export const makePluginList = async () => {
    const enabledPlugins = await getEnabledPlugins();
    return builtInPlugins.concat(enabledPlugins);
};

export const makePluginMap = async () => {
    return (await makePluginList()).reduce((acc, plugin) => {
        if (!plugin) {
            console.log(acc);
            return acc;
        }
        console.log(JSON.stringify(plugin, undefined, 2));
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

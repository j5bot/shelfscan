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

export const makePluginMap = async () => {
    const plugins = (await getEnabledPlugins()).concat(builtInPlugins);
    return plugins.reduce((acc, plugin) => {
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

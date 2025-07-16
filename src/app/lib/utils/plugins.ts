import { getEnabledPlugins } from '@/app/lib/database/database';
import { ShelfScanPluginMap, TemplateType } from '@/app/lib/types/plugins';

export const makePluginMap = async () => {
    const plugins = await getEnabledPlugins();
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

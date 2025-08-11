import { ImageCacheManager } from '@/app/ui/settings/ImageCacheManager';
import { MarketPreferenceManager } from '@/app/ui/settings/MarketPreferenceManager';
import { PluginManager } from '@/app/ui/settings/PluginManager';

export const Settings = () => {
    return <div className="flex flex-col gap-1">
        <MarketPreferenceManager />
        <PluginManager />
        <ImageCacheManager />
    </div>;
};

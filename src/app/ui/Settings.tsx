import { ImageCacheManager } from '@/app/ui/ImageCacheManager';
import { PluginManager } from '@/app/ui/plugins/PluginManager';

export const Settings = () => {
    return <div className="flex flex-col gap-1">
        <PluginManager />
        <ImageCacheManager />
    </div>;
};

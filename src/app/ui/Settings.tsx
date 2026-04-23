import { ImageCacheManager } from '@/app/ui/settings/ImageCacheManager';
import { MarketPreferenceManager } from '@/app/ui/settings/MarketPreferenceManager';
import { PluginManager } from '@/app/ui/settings/PluginManager';
import { ScanHistoryManager } from '@/app/ui/settings/ScanHistoryManager';

export const Settings = () => {
    return <div className="flex flex-col gap-1">
        <MarketPreferenceManager />
        <PluginManager />
        <ScanHistoryManager />
        <ImageCacheManager />
    </div>;
};

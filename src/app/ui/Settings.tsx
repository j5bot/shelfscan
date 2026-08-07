import { useSync } from '@/app/lib/extension/useSync';
import { BackupManager } from '@/app/ui/settings/BackupManager';
import { DataFormManager } from '@/app/ui/settings/DataFormManager';
import { ImageCacheManager } from '@/app/ui/settings/ImageCacheManager';
import { MarketPreferenceManager } from '@/app/ui/settings/MarketPreferenceManager';
import { PluginManager } from '@/app/ui/settings/PluginManager';
import { ScanHistoryManager } from '@/app/ui/settings/ScanHistoryManager';

export const Settings = () => {
    const { syncOn } = useSync();

    return <div className="flex flex-col gap-1">
        {syncOn && <MarketPreferenceManager />}
        <PluginManager />
        {syncOn && <DataFormManager />}
        <ScanHistoryManager />
        <BackupManager />
        <ImageCacheManager />
    </div>;
};

import { useSync } from '@/app/lib/extension/useSync';
import { useAddPlayTool } from '@/app/lib/hooks/webmcp/extension/useAddPlayTool';
import { useAddToCollectionTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionTool';

export const useManageCollectionTool = () => {
    const { syncOn, hasSubscription, userId, currentUsername } = useSync();
    const canUseExtension = syncOn && hasSubscription;

    useAddToCollectionTool(canUseExtension ? userId : undefined);
    useAddPlayTool(canUseExtension ? userId : undefined, canUseExtension ? currentUsername : undefined);
};

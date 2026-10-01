import { useSync } from '@/app/lib/extension/useSync';
import { useAddToCollectionTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionTool';

export const useManageCollectionTool = () => {
    const { syncOn, hasSubscription, userId } = useSync();

    useAddToCollectionTool(syncOn && hasSubscription ? userId : undefined);
};

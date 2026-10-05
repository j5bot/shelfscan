import { useSync } from '@/app/lib/extension/useSync';
import { useAddPlayTool } from '@/app/lib/hooks/webmcp/extension/useAddPlayTool';
import { useAddToCollectionForTradeTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionForTradeTool';
import { useAddToCollectionTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionTool';
import { useAddToWishlistTool } from '@/app/lib/hooks/webmcp/extension/useAddToWishlistTool';
import { useClearCollectionStatusesTool } from '@/app/lib/hooks/webmcp/extension/useClearCollectionStatusesTool';
import { useRemoveCollectionItemTool } from '@/app/lib/hooks/webmcp/extension/useRemoveCollectionItemTool';
import { useSetPreviouslyOwnedTool } from '@/app/lib/hooks/webmcp/extension/useSetPreviouslyOwnedTool';

export const useManageCollectionTool = () => {
    const { syncOn, hasSubscription, userId, currentUsername } = useSync();
    const canUseExtension = syncOn && hasSubscription;

    useAddToCollectionTool(canUseExtension ? userId : undefined);
    useAddToCollectionForTradeTool(canUseExtension ? userId : undefined);
    useAddToWishlistTool(canUseExtension ? userId : undefined);
    useSetPreviouslyOwnedTool(canUseExtension ? userId : undefined);
    useClearCollectionStatusesTool(canUseExtension ? userId : undefined);
    useRemoveCollectionItemTool(canUseExtension ? userId : undefined);
    useAddPlayTool(canUseExtension ? userId : undefined, canUseExtension ? currentUsername : undefined);
};

import { useSync } from '@/app/lib/extension/useSync';
import { useAddPlayTool } from '@/app/lib/hooks/webmcp/extension/useAddPlayTool';
import { useAddToCollectionForTradeTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionForTradeTool';
import { useAddToCollectionTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionTool';
import { useAddToWishlistTool } from '@/app/lib/hooks/webmcp/extension/useAddToWishlistTool';
import { useClearCollectionStatusesTool } from '@/app/lib/hooks/webmcp/extension/useClearCollectionStatusesTool';
import { useRemoveCollectionItemTool } from '@/app/lib/hooks/webmcp/extension/useRemoveCollectionItemTool';
import { useSetPreviouslyOwnedTool } from '@/app/lib/hooks/webmcp/extension/useSetPreviouslyOwnedTool';

export const useManageCollectionTool = () => {
    const {
        syncOn,
        hasSubscription,
        userId,
        currentUsername,
        extensionUser,
    } = useSync();

    const canUseExtension = syncOn
                            && hasSubscription
                            && (!extensionUser || currentUsername === extensionUser);

    const conditionalUserId = canUseExtension ? userId : undefined;
    const conditionalUsername = canUseExtension ? currentUsername : undefined;

    useAddToCollectionTool(conditionalUserId);
    useAddToCollectionForTradeTool(conditionalUserId);
    useAddToWishlistTool(conditionalUserId);
    useSetPreviouslyOwnedTool(conditionalUserId);
    useClearCollectionStatusesTool(conditionalUserId);
    useRemoveCollectionItemTool(conditionalUserId);
    useAddPlayTool(conditionalUserId, conditionalUsername);
};

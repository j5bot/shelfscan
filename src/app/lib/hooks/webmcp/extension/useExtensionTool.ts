import { useSync } from '@/app/lib/extension/useSync';
import { useAddPlayTool } from '@/app/lib/hooks/webmcp/extension/useAddPlayTool';
import { useAddToCollectionForTradeTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionForTradeTool';
import { useAddToCollectionTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionTool';
import { useAddToWishlistTool } from '@/app/lib/hooks/webmcp/extension/useAddToWishlistTool';
import { useClearCollectionStatusesTool } from '@/app/lib/hooks/webmcp/extension/useClearCollectionStatusesTool';
import { useCollectionInfoTool } from '@/app/lib/hooks/webmcp/extension/useCollectionInfoTool';
import { useRemoveCollectionItemTool } from '@/app/lib/hooks/webmcp/extension/useRemoveCollectionItemTool';
import { useSetPreviouslyOwnedTool } from '@/app/lib/hooks/webmcp/extension/useSetPreviouslyOwnedTool';
import { getExtensionToolAccess } from '@/app/lib/utils/extensionToolAccess';

export const useExtensionTool = () => {
    const access = getExtensionToolAccess(useSync());

    useAddToCollectionTool(access);
    useAddToCollectionForTradeTool(access);
    useAddToWishlistTool(access);
    useSetPreviouslyOwnedTool(access);
    useClearCollectionStatusesTool(access);
    useRemoveCollectionItemTool(access);
    useCollectionInfoTool(access);
    useAddPlayTool(access);
};

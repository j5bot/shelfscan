import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { DispatchExtensionMessage, useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { getBggImageUrl } from '@/app/lib/extension/messaging/getImageUrls';
import { useSync } from '@/app/lib/extension/useSync';
import { getBggSearchImageUrlCacheId } from '@/app/lib/utils/bggSearch';
import { useEffect, useState } from 'react';

// image URLs found this session; null when BGG has none for the image
const imageUrls = new Map<number, string | null>();

type ResolveImageUrlParams = {
    imageId: number;
    syncOn: boolean;
    dispatchExtensionMessage: DispatchExtensionMessage;
};

/** The image's URL from the Dexie cache, else from the extension (then cached). Undefined on failure. */
const resolveImageUrl = async (params: ResolveImageUrlParams): Promise<string | null | undefined> => {
    const { imageId, syncOn, dispatchExtensionMessage } = params;
    const cacheId = getBggSearchImageUrlCacheId(imageId);

    try {
        const cached = await getResponseFromCache(cacheId);
        if (cached) {
            return cached;
        }
    } catch (e) {
        console.error('image url cache read failed', cacheId, e);
    }
    if (!syncOn) {
        return undefined;
    }

    try {
        const url = await getBggImageUrl({ imageId, dispatchExtensionMessage });
        if (url) {
            addResponseToCache({ id: cacheId, method: 'GET', response: url })
                .catch((e: unknown) => console.error('image url cache write failed', cacheId, e));
        }
        return url ?? null;
    } catch (e) {
        console.error('getImageUrls failed', imageId, e);
        return undefined;
    }
};

type ResolvedImageUrl = {
    imageId: number;
    url: string | undefined;
};

/** The URL to show for a BGG search result's image (the extension's `rep_imageid`); undefined until known. */
export const useBggSearchImageUrl = (imageId: number | undefined) => {
    const { syncOn } = useSync();
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const [resolved, setResolved] = useState<ResolvedImageUrl | null>(null);

    useEffect(() => {
        if (!imageId || imageUrls.has(imageId)) {
            return;
        }
        let active = true;
        resolveImageUrl({ imageId, syncOn, dispatchExtensionMessage }).then(url => {
            // failures aren't remembered, so a later render can try again
            if (url !== undefined) {
                imageUrls.set(imageId, url);
            }
            if (active) {
                setResolved({ imageId, url: url ?? undefined });
            }
        });
        return () => {
            active = false;
        };
    }, [imageId, syncOn, dispatchExtensionMessage]);

    if (!imageId) {
        return undefined;
    }
    const known = imageUrls.get(imageId);
    if (known !== undefined) {
        return known ?? undefined;
    }
    return resolved?.imageId === imageId ? resolved.url : undefined;
};

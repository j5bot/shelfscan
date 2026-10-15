import { DispatchExtensionMessage } from '@/app/lib/extension/ExtensionMessagingProvider';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import PQueue from 'p-queue';

const IMAGE_URLS_TIMEOUT_MS = 10_000;

// one at a time: replies are matched to messages by type and timestamp, so two sent in the same millisecond collide
const imageUrlsQueue = new PQueue({ concurrency: 1 });

type ImageUrlsResponse = { imageSets?: { mediacard?: { 'src@2x'?: unknown } } } | undefined;

/** The image URL to show from a getImageUrls reply (BGG's `/api/images/{id}` with `imageSets`). */
export const getMediacardImageUrl = (response: unknown): string | undefined => {
    const url = (response as ImageUrlsResponse)?.imageSets?.mediacard?.['src@2x'];
    return typeof url === 'string' && url.length > 0 ? url : undefined;
};

export type GetBggImageUrlParams = {
    imageId: number;
    dispatchExtensionMessage: DispatchExtensionMessage;
    timeoutMs?: number;
};

/** Asks the extension for a BGG image's URLs ('getImageUrls'); undefined when it has none or doesn't reply. */
export const getBggImageUrl = async (params: GetBggImageUrlParams): Promise<string | undefined> => {
    const { imageId, dispatchExtensionMessage, timeoutMs = IMAGE_URLS_TIMEOUT_MS } = params;
    return imageUrlsQueue.add(async () => {
        const result = await withExtensionTimeout(
            Promise.resolve(dispatchExtensionMessage({ type: 'getImageUrls', imageId })),
            timeoutMs,
        );
        return getMediacardImageUrl(result?.response);
    }) as Promise<string | undefined>;
};

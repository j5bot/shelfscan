import { describe, it, expect, vi } from '../setup';
import { DocumentMessageResponseDetail } from '@/app/lib/extension/messageTypes';
import { getBggImageUrl, getMediacardImageUrl } from '@/app/lib/extension/messaging/getImageUrls';
import { ExtensionTimeoutError } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { getBggSearchImageCacheId, getBggSearchImageUrlCacheId } from '@/app/lib/utils/bggSearch';

const SRC_2X = 'https://cf.geekdo-images.com/x__mediacard@2x/img/y=/576x324/filters:strip_icc()/pic8621446.jpg';
const imagesReply = {
    imageid: 8621446,
    imageSets: {
        mediacard: { src: 'https://cf.geekdo-images.com/x__mediacard/img/y=/288x162/pic8621446.jpg', 'src@2x': SRC_2X },
    },
};
const reply = (response: unknown) => ({ type: 'getImageUrls-response', response } as DocumentMessageResponseDetail);

describe('getMediacardImageUrl', () => {
    it("uses imageSets.mediacard['src@2x']", () => {
        expect(getMediacardImageUrl(imagesReply)).toBe(SRC_2X);
    });

    it('is undefined without it', () => {
        expect(getMediacardImageUrl(undefined)).toBeUndefined();
        expect(getMediacardImageUrl({ images: {} })).toBeUndefined();
        expect(getMediacardImageUrl({ imageSets: { mediacard: { 'src@2x': '' } } })).toBeUndefined();
    });
});

describe('getBggImageUrl', () => {
    it('sends a getImageUrls message with the image id', async () => {
        const dispatchExtensionMessage = vi.fn(async () => reply(imagesReply));
        await expect(getBggImageUrl({ imageId: 8621446, dispatchExtensionMessage })).resolves.toBe(SRC_2X);
        expect(dispatchExtensionMessage).toHaveBeenCalledWith({ type: 'getImageUrls', imageId: 8621446 });
    });

    it('sends messages one at a time', async () => {
        let inFlight = 0;
        let maxInFlight = 0;
        const dispatchExtensionMessage = vi.fn(async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise(resolve => setTimeout(resolve, 5));
            inFlight--;
            return reply(imagesReply);
        });
        await Promise.all([1, 2, 3].map(imageId => getBggImageUrl({ imageId, dispatchExtensionMessage })));
        expect(dispatchExtensionMessage).toHaveBeenCalledTimes(3);
        expect(maxInFlight).toBe(1);
    });

    it('rejects when the extension does not reply in time', async () => {
        const dispatchExtensionMessage = vi.fn(() => new Promise<undefined>(() => undefined));
        await expect(getBggImageUrl({ imageId: 1, dispatchExtensionMessage, timeoutMs: 10 }))
            .rejects.toBeInstanceOf(ExtensionTimeoutError);
    });
});

describe('bgg-search cache ids', () => {
    it('prefixes image and image URL cache ids with bgg-search', () => {
        expect(getBggSearchImageCacheId(8621446)).toBe('bgg-search|8621446');
        expect(getBggSearchImageUrlCacheId(8621446)).toBe('bgg-search|url|8621446');
    });
});

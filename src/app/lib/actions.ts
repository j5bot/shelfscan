'use server';

import { ThumbnailImageMismatchEntry } from '@/app/lib/hooks/useThumbnailImageMismatch';
import { bggHost } from '@/app/lib/services/bgg/constants';
import { JSDOM } from 'jsdom';
import sleep from 'sleep-promise';

const bggCollectionBaseURL = `${bggHost}/xmlapi2/collection`;
const bggUserBaseURL = `${bggHost}/xmlapi2/user`;
const bggThingBaseURL = `${bggHost}/xmlapi2/thing`;

const MAX_ATTEMPTS = 20;

const fetchFromBggWithToken = async (url: string, args: RequestInit, attempts: number = 0) => {
    if (attempts > MAX_ATTEMPTS) {
        return Promise.reject('Too many retries');
    }
    const bggToken = process.env.BGG_TOKEN;
    if (!bggToken) {
        throw new Error('cannot fetch from BGG without token');
    }

    const headerToAdd = {
        Authorization: `Bearer ${bggToken}`,
    };
    // precedence given to existing headers
    args.headers = Object.assign({}, headerToAdd, args.headers);
    const response = await fetch(url, args);

    if (response.status === 202 && attempts < MAX_ATTEMPTS) {
        await sleep(2000);
        return await fetchFromBggWithToken(url, args, attempts + 1);
    }
    return response;
};

export const bggGetUserInner = async (username: string) => {
    const bggUserUrl = new URL(bggUserBaseURL);
    bggUserUrl.searchParams.append('name', username);
    bggUserUrl.searchParams.append('buddies', '1');

    return await fetchFromBggWithToken(bggUserUrl.toString(), {}).then(r => r.text());
};

export const bggGetCollectionInner =
    async (username: string, attempts: number = 0): Promise<string> => {
        if (attempts > MAX_ATTEMPTS) {
            return '';
        }

        const collectionUrl = new URL(bggCollectionBaseURL);
        const cuParams = collectionUrl.searchParams;

        cuParams.append('username', username);
        cuParams.append('version', '1');
        cuParams.append('stats', '1');

        return await fetchFromBggWithToken(collectionUrl.toString(), {}).then(r => r.text());
    };

export const bggGetThingXml = async (bggId: number): Promise<string> => {
    const thingUrl = new URL(bggThingBaseURL);
    thingUrl.searchParams.append('id', String(bggId));
    thingUrl.searchParams.append('versions', '1');
    return await fetchFromBggWithToken(thingUrl.toString(), {}).then(r => r.text());
};

const bggGetThingsXml = async (bggIds: number[]): Promise<string> => {
    const thingUrl = new URL(bggThingBaseURL);
    thingUrl.searchParams.append('id', bggIds.join(','));
    thingUrl.searchParams.append('versions', '1');
    return await fetchFromBggWithToken(thingUrl.toString(), {}).then(r => r.text());
};

const extractImageUrls = (
    document: Document,
    selector: string,
): { thumbnail: string; image: string } | undefined => {
    const el = document.querySelector(selector);
    if (!el) {
        return undefined;
    }
    const thumbnail = el.querySelector('thumbnail')?.textContent?.trim();
    const image = el.querySelector('image')?.textContent?.trim();
    if (thumbnail && image && thumbnail !== image) {
        return { thumbnail, image };
    }
    return undefined;
};

export const bggGetImageUrlMap = async (
    queue: ThumbnailImageMismatchEntry[],
): Promise<Record<string, string>> => {
    if (queue.length === 0) {
        return {};
    }

    const map: Record<string, string> = {};
    const ids = queue.map(({ id }) => id);
    const xml = await bggGetThingsXml(ids);
    const { window: { document } } = new JSDOM(xml, { contentType: 'text/xml' });

    queue.forEach(({ id, versionIds }) => {
        if (versionIds.length === 0) {
            // Top-level info mismatch — resolve via the game's own image element.
            const result = extractImageUrls(
                document,
                `item[type="boardgame"][id="${id}"]`,
            );
            if (result) {
                map[result.thumbnail] = result.image;
            }
            return;
        }

        versionIds.forEach(versionId => {
            const safeVersionId = parseInt(String(versionId), 10);
            if (!Number.isFinite(safeVersionId)) {
                return;
            }
            const result = extractImageUrls(
                document,
                `item[type="boardgameversion"][id="${safeVersionId}"]`,
            );
            if (result) {
                map[result.thumbnail] = result.image;
            }
        });
    });

    return map;
};


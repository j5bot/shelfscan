import { getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import {
    BggCollectionItem,
    BggCollectionMap,
    BggCollectionStatuses,
    BggUser,
    PossibleStatuses
} from '@/app/lib/types/bgg';
import { elementGetter, getPageDOM } from '@/app/lib/utils/xml';

export const getBggUser = (response: string) => {
    const document = getPageDOM(response, true);

    const user = document.querySelector('user');
    const name = user?.getAttribute('name')?.toLowerCase();
    const id = user?.getAttribute('id');
    const lastLogin = document
        .querySelector('lastlogin')
        ?.getAttribute('value');
    const firstName = document
        .querySelector('firstname')
        ?.getAttribute('value');
    const lastName = document
        .querySelector('lastname')
        ?.getAttribute('value');
    const state = document
        .querySelector('stateorprovince')
        ?.getAttribute('value');
    const country = document
        .querySelector('country')
        ?.getAttribute('value');
    const tradeRating = parseFloat(
        document.querySelector('traderating')?.getAttribute('value') ?? '0',
    );
    const marketRating = parseFloat(
        document.querySelector('marketrating')?.getAttribute('value') ??
        '0',
    );
    const avatarUrl = document
        .querySelector('avatarlink')
        ?.getAttribute('value');

    return {
        user: name,
        id,
        lastLogin,
        firstName,
        lastName,
        state,
        country,
        tradeRating,
        marketRating,
        avatarUrl,
    } as BggUser;
};

export const getCollectionFromCache = async (id: string) => {
    return await getResponseFromCache(id);
};

export const getCommonDetails = (item: Element | null) => {
    if (!item) {
        return;
    }
    const name = elementGetter(item, false, 'name') as string;
    const yearPublished =
        elementGetter(item, true, 'yearPublished') as number | undefined;

    return { name, yearPublished };
};

export const getVersionDetails = (item: Element | null) => {
    if (!item) {
        return;
    }

    const version = item.querySelector('version item');
    if (!version) {
        return;
    }

    const commonDetails = getCommonDetails(item);
    const id = elementGetter(version, true, undefined, 'id');
    const image = elementGetter(version, false, 'image');
    const productCode = elementGetter(version, false, 'productcode');
    const languages = Array.from(version.querySelectorAll('link[type=language]'))
        .map(link => elementGetter(link, false, undefined, 'value'));

    return {
        ...commonDetails,
        id,
        image,
        languages,
        productCode,
    };
};

export const getCollectionFromXml = (xml?: string) => {
    if (!xml || xml.length === 0) {
        return;
    }
    const rawItems = getPageDOM(xml, true).querySelector('items');
    if (!rawItems) {
        return;
    }
    const items: BggCollectionItem[] = Array.from(rawItems.children)
        .map(item => {
            const commonDetails = getCommonDetails(item);
            const objectId = elementGetter(item, true, undefined, 'objectid');
            const subType = elementGetter(item, false, undefined, 'subtype') ?? 'boardgame';
            const collectionId = elementGetter(item, true, undefined, 'collid');
            const version = getVersionDetails(item);
            const status = item.getElementsByTagName('status')?.[0];
            const rating = elementGetter(item, false, 'stats > rating', 'value');

            const statuses = status ? PossibleStatuses.reduce((acc: BggCollectionStatuses, attributeName: string) => {
                return Object.assign(acc, {[attributeName]: status.getAttribute(attributeName) === '1'})
            }, {} as BggCollectionStatuses) : {};

            if (!(objectId && collectionId)) {
                return undefined;
            }

            return {
                ...commonDetails,
                objectId,
                versionId: version?.id,
                subType,
                collectionId,
                version,
                statuses,
                rating: rating === 'N/A' ? undefined : parseFloat(rating?.toString() ?? '0'),
            } as BggCollectionItem;
        })
        .filter(x => x !== undefined);

    return items.reduce((acc: BggCollectionMap, item: BggCollectionItem) => {
        return Object.assign(acc, {[item.collectionId]: item});
    }, {} as BggCollectionMap);
};

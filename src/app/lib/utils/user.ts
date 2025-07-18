import {
    bggGetCollectionInner,
    bggGetUserInner
} from '@/app/lib/actions';
import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { removeSetting, setSetting } from '@/app/lib/database/database';
import { useDispatch } from '@/app/lib/hooks';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import {
    getBggUser,
    getCollectionFromCache,
    getCollectionFromXml
} from '@/app/lib/services/bgg/service';
import { useTransition } from 'react';

export const useLoadUser = () => {
    const dispatch = useDispatch();
    const [isPending, startTransition] = useTransition();

    const loadUser = (
        username?: string,
        rememberMe: boolean = false,
        useCache: boolean = true
    ) => {
        if (!username) {
            return;
        }
        startTransition(async () => {
            const id = `collection|${username}`;
            const userCacheId = `user|${username}`;

            if (rememberMe) {
                setSetting('username', username).then();
            } else {
                removeSetting('username').then();
            }

            let xml: string | undefined;
            let userXml: string | undefined;

            if (useCache) {
                xml = await getCollectionFromCache(id);
                userXml = await getResponseFromCache(`user|${username}`);
            }
            if (!xml) {
                xml = await bggGetCollectionInner(username, 0);
                addResponseToCache({ id, method: 'GET', response: xml }).then();
            }
            if (!userXml) {
                userXml = await bggGetUserInner(username);
                addResponseToCache({ id: userCacheId, method: 'GET', response: userXml }).then();
            }
            if (userXml) {
                dispatch(setBggUser(getBggUser(userXml)));
            }

            const items = getCollectionFromXml(xml);
            if (items) {
                dispatch(updateCollectionItems({
                    username,
                    items,
                }));
            }
        });
    };

    return { isPending, loadUser };
};

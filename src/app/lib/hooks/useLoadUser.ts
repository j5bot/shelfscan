import {
    bggGetCollectionInner,
    bggGetUserInner
} from '@/app/lib/actions';
import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { removeSetting, setSetting } from '@/app/lib/database/database';
import { useDispatch } from '@/app/lib/hooks/index';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import {
    getBggUser,
    getCollectionFromCache,
    getCollectionFromXml
} from '@/app/lib/services/bgg/service';
import { BggCollectionMap } from '@/app/lib/types/bgg';
import { useEffect, useState, useTransition } from 'react';

export const useLoadUser = () => {
    const dispatch = useDispatch();
    const [isPending, startTransition] = useTransition();
    const [username, setUsername] = useState<string>();
    const [userXml, setUserXml] = useState<string>();
    const [items, setItems] = useState<BggCollectionMap>();

    useEffect(() => {
        if (!(items && username && userXml)) {
            return;
        }
        dispatch(setBggUser(getBggUser(userXml)));
        dispatch(updateCollectionItems({
            username,
            items,
        }));
    }, [items, username, userXml]);

    const loadUser = (
        username?: string,
        rememberMe: boolean = false,
        useCache: boolean = true
    ) => {
        if (!username) {
            return;
        }
        setUsername(username);
        startTransition(async () => {
            const id = `collection|${username.toLowerCase()}`;
            const userCacheId = `user|${username.toLowerCase()}`;

            if (rememberMe) {
                setSetting('username', username).then();
            } else {
                removeSetting('username').then();
            }

            let xml: string | undefined;
            let userXml: string | undefined;

            if (useCache) {
                xml = await getCollectionFromCache(id);
                userXml = await getResponseFromCache(userCacheId);
            }
            if (!xml) {
                xml = await bggGetCollectionInner(username, 0);
                addResponseToCache({ id, method: 'GET', response: xml }).then();
            }
            if (!userXml) {
                userXml = await bggGetUserInner(username);
                addResponseToCache({ id: userCacheId, method: 'GET', response: userXml }).then();
            }
            setUserXml(userXml);

            const items = getCollectionFromXml(xml);
            if (items) {
                setItems(items);
            }
        });
    };

    return { isPending, loadUser };
};

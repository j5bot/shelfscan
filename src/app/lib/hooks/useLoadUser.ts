import {
    bggGetCollectionInner,
    bggGetUserInner
} from '@/app/lib/actions';
import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { getCollection, removeSetting, setSetting } from '@/app/lib/database/database';
import { useDispatch } from '@/app/lib/hooks/index';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import {
    getBggUser,
    getCollectionFromCache,
    getCollectionFromXml
} from '@/app/lib/services/bgg/service';
import { BggCollectionMap } from '@/app/lib/types/bgg';
import posthog from 'posthog-js';
import { useEffect, useState, useTransition } from 'react';
import sleep from 'sleep-promise';

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
        const user = getBggUser(userXml);

        if (user.id) {
            const distinctId = `bgg:${user.user}`;
            const currentDistinctId = posthog.get_distinct_id();

            if (currentDistinctId.startsWith('bgg:') && currentDistinctId !== distinctId) {
                posthog.reset();
            }

            posthog.identify(distinctId, {
                bgg_username: user.user,
            });
        }

        dispatch(setBggUser(user));
        dispatch(updateCollectionItems({
            username,
            items,
        }));
    }, [items, username, userXml, dispatch]);

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
            const expansionsId = `collection-expansions|${username.toLowerCase()}`;
            const userCacheId = `user|${username.toLowerCase()}`;

            if (rememberMe) {
                setSetting('username', username).then();
            } else {
                removeSetting('username').then();
            }

            let xml: string | undefined;
            let expansionsXml: string | undefined;
            let userXml: string | undefined;

            if (useCache) {
                xml = await getCollectionFromCache(id);
                expansionsXml = await getCollectionFromCache(expansionsId);
                userXml = await getResponseFromCache(userCacheId);
            }
            if (!xml || !expansionsXml) {
                const [gamesXml, expansionsResult] = await Promise.all([
                    xml ?? bggGetCollectionInner(username, false, 0),
                    expansionsXml ?? bggGetCollectionInner(username, true, 0),
                ]);
                xml = gamesXml;
                expansionsXml = expansionsResult;

                if (!xml.startsWith('<error>') && !expansionsXml.startsWith('<error>')) {
                    addResponseToCache({ id, method: 'GET', response: xml }).then();
                    addResponseToCache({ id: expansionsId, method: 'GET', response: expansionsXml }).then();
                } else {
                    await sleep(10000);
                    loadUser(username, rememberMe, useCache);
                    return;
                }
            }
            if (!userXml) {
                userXml = await bggGetUserInner(username);
                addResponseToCache({ id: userCacheId, method: 'GET', response: userXml }).then();
            }
            setUserXml(userXml);

            let items: BggCollectionMap | undefined;
            if (useCache) {
                items = await getCollection(username.toLowerCase());
            }
            if (!items) {
                items = getCollectionFromXml(xml, expansionsXml);
            }
            if (items) {
                setItems(items);
            }
        });
    };

    return { isPending, loadUser };
};

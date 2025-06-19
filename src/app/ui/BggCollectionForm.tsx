'use client';

import { bggGetCollection, bggGetUser } from '@/app/lib/actions';
import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { RootState } from '@/app/lib/redux/store';
import {
    getBggUser,
    getCacheIdForCollection,
    getCollectionFromCache,
    getCollectionFromXml
} from '@/app/lib/services/bgg/service';
import { BggCollectionMap } from '@/app/lib/types/bgg';
import React, { useEffect, useState, useTransition } from 'react';

export const BggCollectionForm = ()=> {
    const dispatch = useDispatch();

    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);

    const [isPending, startTransition] = useTransition();
    const [username, setUsername] = useState<string | undefined>();
    const [collectionXml, setCollectionXml] = useState<string>();
    const [userXml, setUserXml] = useState<string>();
    const [collectionItems, setCollectionItems] = useState<BggCollectionMap>();

    useEffect(() => {
        if (!currentUsername) {
            return;
        }
        setUsername(currentUsername);
    }, [currentUsername, setUsername]);

    useEffect(() => {
        if (!(collectionItems && username && userXml)) {
            return;
        }
        dispatch(setBggUser(getBggUser(userXml)));
        dispatch(updateCollectionItems({
            username,
            items: collectionItems,
        }));
    }, [collectionItems, username, userXml]);

    const getCollectionAction = async (formData: FormData) => {
        startTransition(async () => {
            const username = formData.get('username')?.toString();
            const id = getCacheIdForCollection(formData);
            const userCacheId = `user|${username}`;
            const useCache = formData.get('useCache') === 'true';

            if (!(id && username)) {
                return;
            }

            setUsername(username);

            let xml: string | undefined;
            let userXml: string | undefined;

            if (useCache) {
                xml = await getCollectionFromCache(id);
                userXml = await getResponseFromCache(`user|${username}`);
            }
            if (!xml) {
                xml = await bggGetCollection(formData);
                addResponseToCache({ id, method: 'GET', response: xml }).then();
            }
            if (!userXml) {
                userXml = await bggGetUser(formData);
                addResponseToCache({id: userCacheId, method: 'GET', response: userXml }).then();
            }
            setCollectionXml(xml);
            setUserXml(userXml);
            const items = getCollectionFromXml(xml);

            if (!items) {
                return;
            }
            setCollectionItems(items);
        });
    };

    const formStyle = {
        fontSize: '0.8em',
    };
    const labelStyle = { fontSize: '0.7em', '--size-selector': '0.2rem' };

    return !currentUsername && <form action={getCollectionAction} className="w-full">
            <fieldset style={formStyle} className={`bg-gray-100 rounded-lg flex flex-wrap gap-2 p-2 justify-center items-center`}>
                <input className="grow bg-white p-2 rounded-md max-w-3/8 md:max-w-64"
                       type="text" name="username" placeholder="BGG Username" />
                <button
                    className="grow p-2 rounded-md bg-gray-200 cursor-pointer whitespace-nowrap max-w-1/4 min-w-fit md:max-w-52"
                    name="getCollection"
                    disabled={isPending} aria-disabled={isPending}
                    type="submit"
                >
                    Get Collection
                </button>
                <label style={labelStyle} htmlFor="useCache">
                    <input disabled={isPending}
                           type="checkbox" value="true" defaultChecked={true} id="useCache"
                           name="useCache" className="checkbox" /> Use Cache
                </label>
            </fieldset>
        </form>;
};

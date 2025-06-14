'use client';

import { bggGetCollection } from '@/app/lib/actions';
import { getImageIdFromUrl } from '@/app/lib/utils/image';
import { getPageDOM } from '@/app/lib/utils/xml';
import React, { useEffect, useState, useTransition } from 'react';

const PossibleStatuses = [
    'own',
    'prevowned',
    'fortrade',
    'want',
    'wanttoplay',
    'wanttobuy',
    'wishlist',
    'preordered'
] as const;

export const BggCollectionForm = ()=> {
    const [isPending, startTransition] = useTransition();
    const [collectionXml, setCollectionXml] = useState<string>();

    useEffect(() => {
        if (!collectionXml || collectionXml.length === 0) {
            return;
        }
        const rawItems = getPageDOM(collectionXml, true).getElementsByTagName('items')[0];
        console.log('rawItems', rawItems);
        if (!rawItems) {
            return;
        }
        const items = Array.from(rawItems.children)
            .map(item => {
                const objectId = item.getAttribute('objectid');
                const subType = item.getAttribute('subtype');
                const collectionId = item.getAttribute('collid');
                const name = item.getElementsByTagName('name')[0]?.innerHTML;
                const yearPublishedString = item.getElementsByTagName('yearpublished')?.[0]?.innerHTML;
                const yearPublished = yearPublishedString ? parseInt(yearPublishedString, 10) : undefined;
                const versionImageId = getImageIdFromUrl(
                    item.getElementsByTagName('thumbnail')?.[0]?.innerHTML ?? ''
                );
                const status = item.getElementsByTagName('status')?.[0];

                const statuses = status ? PossibleStatuses.reduce((acc: Record<string, boolean>, attributeName: string) => {
                    return Object.assign(acc, {[attributeName]: status.getAttribute(attributeName) === '1'})
                }, {} as Record<string, boolean>) : {};

                return {
                    objectId,
                    subType,
                    collectionId,
                    name,
                    yearPublished,
                    // this is used to match the version retrieved from gameupc
                    versionImageId,
                    statuses,
                }
            });
        console.log('items', items);
    }, [collectionXml]);

    const getCollectionAction = async (formData: FormData) => {
        startTransition(async () => {
            setCollectionXml(await bggGetCollection(formData));
        });
    }

    const containerClassName = 'bg-gray-100 rounded-lg flex flex-wrap gap-4 p-3';

    return <form action={getCollectionAction} className="w-full">
            <fieldset className={containerClassName}>
                <input className="grow bg-white p-2 rounded-md max-w-3/8"
                       type="text" name="username" placeholder="BGG Username" />
                <button
                    className="grow p-2 rounded-md bg-gray-200 cursor-pointer whitespace-nowrap max-w-1/4"
                    name="getCollection"
                    disabled={isPending} aria-disabled={isPending}
                    type="submit"
                >
                    Get Collection
                </button>
            </fieldset>
        </form>;
};

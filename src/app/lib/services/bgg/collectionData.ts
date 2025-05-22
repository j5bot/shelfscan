/*
 Sample URL: /api/collections?objectid=232830&objecttype=thing&userid=2382168
 */

import { bggWorkerHost } from '@/app/lib/services/bgg/constants';
import { GameUPCData } from '@/app/lib/types/GameUPCData';

const collectionApiUrl = `${bggWorkerHost}/api/collections`;

export type GetCollectionItemsParams = {
    userId: string;
    cookie: string;
    data: GameUPCData;
};

export const getCollectionItems = async (
    params: GetCollectionItemsParams,
) => {
    const { cookie, data, userId } = params;

    if (!userId) {
        return;
    }

    const {
        bgg_info: bggInfo,
    } = data;

    if (!bggInfo?.[0]?.id) {
        return;
    }

    const searchParams = new URLSearchParams({
        userid: userId,
        objectid: bggInfo[0].id.toString(),
        objecttype: 'thing',
    });

    return await fetch(
        `${collectionApiUrl}?${searchParams.toString()}`,
        {
            headers: {
                cookie,
            },
        },
    ).then(response => response.json());
};

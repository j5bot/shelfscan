import { bggHost } from '@/app/lib/services/bgg/constants';
import { GameUPCData } from '@/app/lib/types/GameUPCData';

const collectionApiUrl = `${bggHost}/api/collections`;

export type GetCollectionItemsParams = {
    userId: string;
    data: GameUPCData;
};

export const getCollectionItems = async (
    params: GetCollectionItemsParams,
) => {
    const { data, userId } = params;

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
    ).then(response => response.json());
};

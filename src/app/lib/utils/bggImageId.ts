import { BggCollectionItem } from '@/app/lib/types/bgg';

export const getBggImageId = (url: string | undefined): number => {
    if (!url) { return 0; }
    const match = url.match(/pic(\d+)\./);
    return match ? parseInt(match[1], 10) : 0;
};

export const getBggImageFromItem = (item: BggCollectionItem) => {
    const image = item.version?.image ?? item.image ?? item.thumbnail;
    return getBggImageId(image);
};

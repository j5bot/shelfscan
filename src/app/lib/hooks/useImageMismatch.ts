import { bggGetThingsXml } from '@/app/lib/actions';
import { bggGetImageUrl } from '@/app/lib/services/bgg/service';
import { getPageDOM } from '@/app/lib/utils/xml';
import { useEffect, useState, useTransition } from 'react';

type MappedImage = {
    key: string;
    promise: Promise<string>;
};

const fetchImageUrl = async (infoId: number, versionId?: number) => {
    const xml = await bggGetThingsXml([infoId]);
    const doc = getPageDOM(xml, true);
    return bggGetImageUrl(doc, infoId, versionId);
};

export const useImageMismatch = (
    infoMismatch: boolean,
    versionMismatch: boolean,
    infoId?: number,
    versionId?: number
): Promise<string> | null => {
    const [, startMapping] = useTransition();

    const shouldMap = !!infoId && (versionId ? versionMismatch : infoMismatch);
    const key = shouldMap ? `${infoId}/${versionId ?? ''}` : null;

    // the promise is kept with the info/version it was fetched for, so it is never returned for another one
    const [mapped, setMapped] = useState<MappedImage>();

    useEffect(() => {
        if (!key || !infoId || mapped?.key === key) {
            return;
        }
        // set in a transition so a component suspending on the promise keeps showing its current image
        startMapping(() => {
            setMapped({ key, promise: fetchImageUrl(infoId, versionId) });
        });
    }, [key, infoId, versionId, mapped?.key]);

    return key && mapped?.key === key ? mapped.promise : null;
};

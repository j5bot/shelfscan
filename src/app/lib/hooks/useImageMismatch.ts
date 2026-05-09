import { bggGetThingsXml } from '@/app/lib/actions';
import { bggGetImageUrl } from '@/app/lib/services/bgg/service';
import { getPageDOM } from '@/app/lib/utils/xml';
import { useEffect, useRef, useState, useTransition } from 'react';

export const useImageMismatch = (
    infoMismatch: boolean,
    versionMismatch: boolean,
    infoId?: number,
    versionId?: number
): Promise<string> | null => {
    const [isMapping, startMapping] = useTransition();

    const promiseRef = useRef<Promise<string>>(null);

    useEffect(() => {
        if (isMapping || !infoId) {
            return;
        }
        if (!versionId && !infoMismatch) {
            return;
        }
        if (versionId && !versionMismatch) {
            return;
        }

        startMapping(() => {
            promiseRef.current = new Promise<string>(async resolve => {
                const xml = await bggGetThingsXml([infoId]);
                const doc = getPageDOM(xml, true);
                resolve(bggGetImageUrl(doc, infoId, versionId));
            });
        });

        return () => {
            promiseRef.current = null;
        };
    }, [infoMismatch, versionMismatch, infoId, versionId]);

    return promiseRef.current;
};
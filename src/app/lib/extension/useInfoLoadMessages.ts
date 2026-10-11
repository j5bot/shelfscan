import { bggHost } from '@/app/lib/services/bgg/constants';
import { InfoLoadItem } from '@/app/lib/utils/collectionInfo';
import { useEffect, useEffectEvent } from 'react';

/** Calls `onInfoLoad` with the collection item of each infoLoad reply from the extension's hidden BGG iframe. */
export const useInfoLoadMessages = (onInfoLoad: (collectionItem: InfoLoadItem) => void) => {
    const handleInfoLoad = useEffectEvent(onInfoLoad);

    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const fromExtension = event.origin === window.location.origin || event.origin === bggHost;
            if (fromExtension && event.data?.type === 'infoLoad-response') {
                handleInfoLoad(event.data.response.collectionItem);
            }
        };

        window.addEventListener('message', messageHandler);
        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, []);
};

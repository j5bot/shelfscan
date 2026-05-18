import {
    DocumentMessageDetail,
    DocumentMessageResponseDetail,
} from '@/app/lib/extension/messageTypes';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { getCollectionItemFromObject } from '@/app/lib/services/bgg/service';
import { gameUPCInfoToCollectionItem } from '@/app/lib/utils/gameAdapters';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

type DispatchExtensionMessage = (
    detail: Partial<DocumentMessageDetail>,
) => Promise<DocumentMessageResponseDetail | undefined> | void;

type ExtensionMessagingContextValue = {
    dispatchExtensionMessage: DispatchExtensionMessage;
};

const ExtensionMessagingContext = createContext<ExtensionMessagingContextValue>({
    dispatchExtensionMessage: () => undefined,
});

export const useExtensionMessaging = () => useContext(ExtensionMessagingContext);

export const ExtensionMessagingProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useDispatch();
    const username = useSelector(state => state.bgg.user?.user);

    const listeningRef = useRef<boolean>(false);
    const messagesRef = useRef<Record<string, [DocumentMessageDetail, DocumentMessageResponseDetail | undefined]>>({});
    const promisesRef = useRef<Record<string, PromiseWithResolvers<DocumentMessageResponseDetail | undefined>>>({});

    const dispatchExtensionMessage = useCallback<DispatchExtensionMessage>((detail: Partial<DocumentMessageDetail>) => {
        if (!detail.type) {
            console.error('message missing type', detail);
            return;
        }
        const isResponse = detail.type.endsWith('-response');
        const timestamp = isResponse
            ? (detail as DocumentMessageResponseDetail).sourceMessage.timestamp
            : detail.timestamp ?? Date.now();
        const key = isResponse
                    ? (detail as DocumentMessageResponseDetail).sourceMessage.type
                    : detail.type;
        const messageKey = `${key}-${timestamp}`;

        // console.log('timestamp', messageKey, timestamp, detail.timestamp);

        const matchingMessages = messagesRef.current[messageKey];

        const timestampedDetail: Partial<DocumentMessageDetail> = { timestamp, ...detail };
        const ce = new CustomEvent('shelfscan-sync', { detail: timestampedDetail });
        document.dispatchEvent(ce);

        if (matchingMessages) {
            const sourceMessage = matchingMessages[0];

            if (detail.type.endsWith('response')) {
                messagesRef.current[messageKey] = [sourceMessage, detail as DocumentMessageResponseDetail];
                return promisesRef.current[messageKey].resolve(detail as DocumentMessageResponseDetail);
            }
        }

        if (!matchingMessages) {
            messagesRef.current[messageKey] = [timestampedDetail as DocumentMessageDetail, undefined];
            promisesRef.current[messageKey] = Promise.withResolvers<DocumentMessageResponseDetail | undefined>();
        }

        return promisesRef.current[messageKey].promise;
    }, []);

    useEffect(() => {
        if (!username || listeningRef.current) {
            return;
        }

        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== 'https://boardgamegeek.com') {
                return;
            }

            const { data: detail } = event;

            dispatchExtensionMessage(detail);

            const collectionItem = detail.response?.collectionItem ?? detail.response;

            if (!(username && detail.type.endsWith('-response') && collectionItem?.collid)) {
                return;
            }
            if (detail.type.startsWith('sell') || detail.type.startsWith('get')) {
                return;
            }

            const { shouldRemove, entry } = detail.response ?? {};
            const info = entry?.info ? gameUPCInfoToCollectionItem(entry.info) : {};

            const updatedItem = {
                ...info,
                ...getCollectionItemFromObject(
                    collectionItem as Record<string, unknown>,
                )
            };

            dispatch(updateCollectionItems({
                username,
                items: {
                    [collectionItem?.collid]: updatedItem,
                },
                update: true,
                remove: shouldRemove,
                extend: true,
            }));
        };

        window.addEventListener('message', messageHandler);
        listeningRef.current = true;

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, [username, dispatch, dispatchExtensionMessage]);

    return (
        <ExtensionMessagingContext.Provider value={{
            dispatchExtensionMessage,
        }}>
            {children}
        </ExtensionMessagingContext.Provider>
    );
};


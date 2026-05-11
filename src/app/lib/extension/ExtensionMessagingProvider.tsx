import {
    DocumentMessageDetail,
    DocumentMessageResponseDetail,
} from '@/app/lib/extension/messageTypes';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { getCollectionItemFromObject } from '@/app/lib/services/bgg/service';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

type DispatchExtensionMessage = (
    detail: Partial<DocumentMessageDetail>,
) => Promise<DocumentMessageResponseDetail | undefined> | void;

type ExtensionMessagingContextValue = {
    dispatchExtensionMessage: DispatchExtensionMessage;
    messages: Record<number, [DocumentMessageDetail, DocumentMessageResponseDetail | undefined]>;
    promises: Record<number, PromiseWithResolvers<DocumentMessageResponseDetail | undefined>>;
};

const ExtensionMessagingContext = createContext<ExtensionMessagingContextValue>({
    dispatchExtensionMessage: () => undefined,
    messages: {},
    promises: {},
});

export const useExtensionMessaging = () => useContext(ExtensionMessagingContext);

export const ExtensionMessagingProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useDispatch();
    const username = useSelector(state => state.bgg.user?.user);

    const listeningRef = useRef<boolean>(false);
    const messagesRef = useRef<Record<number, [DocumentMessageDetail, DocumentMessageResponseDetail | undefined]>>({});
    const promisesRef = useRef<Record<number, PromiseWithResolvers<DocumentMessageResponseDetail | undefined>>>({});

    const dispatchExtensionMessage = useCallback<DispatchExtensionMessage>((detail) => {
        const isResponse = detail.type?.endsWith('-response');
        const timestamp = isResponse
            ? (detail as DocumentMessageResponseDetail).sourceMessage.timestamp
            : detail.timestamp ?? Date.now();

        const matchingMessages = messagesRef.current[timestamp!];

        const timestampedDetail: Partial<DocumentMessageDetail> = { timestamp, ...detail };
        const ce = new CustomEvent('shelfscan-sync', { detail: timestampedDetail });
        document.dispatchEvent(ce);

        if (matchingMessages) {
            const sourceMessage = matchingMessages[0];

            if (detail.type!.endsWith('response')) {
                messagesRef.current[timestamp!] = [sourceMessage, detail as DocumentMessageResponseDetail];
                return promisesRef.current[timestamp!].resolve(detail as DocumentMessageResponseDetail);
            }
        }

        if (!matchingMessages) {
            messagesRef.current[timestamp!] = [timestampedDetail as DocumentMessageDetail, undefined];
            promisesRef.current[timestamp!] = Promise.withResolvers<DocumentMessageResponseDetail | undefined>();
        }

        return promisesRef.current[timestamp!].promise;
    }, []);

    useEffect(() => {
        if (!username || listeningRef.current) {
            return;
        }

        window.addEventListener('message', event => {
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

            const { shouldRemove } = detail.response ?? {};
            dispatch(updateCollectionItems({
                username,
                items: {
                    [collectionItem?.collid]: getCollectionItemFromObject(
                        collectionItem as Record<string, unknown>,
                    ),
                },
                update: true,
                remove: shouldRemove,
                extend: true,
            }));
        });
        listeningRef.current = true;
    }, [username, dispatch, dispatchExtensionMessage]);

    return (
        <ExtensionMessagingContext.Provider value={{
            dispatchExtensionMessage,
            messages: messagesRef.current,
            promises: promisesRef.current,
        }}>
            {children}
        </ExtensionMessagingContext.Provider>
    );
};


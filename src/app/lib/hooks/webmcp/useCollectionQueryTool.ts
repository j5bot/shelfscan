import { useDispatch, useStore } from '@/app/lib/hooks';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { readStoredCollection } from '@/app/lib/services/bgg/storedCollection';
import {
    CollectionQueryInput,
    describeCollectionQueryResult,
    runCollectionQuery,
} from '@/app/lib/utils/collectionQuery';
import { getScannedSets } from '@/app/lib/utils/scanSets';
import { useMcpTool } from 'webmcp-react';

/**
 * Registers `query_bgg_collection`: filters, sorts and summarises the active user's collection with filters the
 * agent supplies. It never reads or writes the collection page's filters, sort, URL or saved view.
 */
export const useCollectionQueryTool = () => {
    const store = useStore();
    const dispatch = useDispatch();
    const { scanHistory, lastScannedMap } = useScanHistory();

    useMcpTool({
        name: 'query_bgg_collection',
        title: 'Query the BGG collection',
        description: 'Answer questions about the active ShelfScan user\'s BoardGameGeek collection, such as '
            + '"how many games do I own that play with 2 players?". Filters by status, rating, plays, player count, '
            + 'play time, scans, search text and tags; sorts; and returns counts (total, games, expansions, items '
            + 'per status) plus a page of matching items. Read-only: it does not change what the collection page '
            + 'shows. Omit a filter to not filter on it. Use limit: 0 when only counts are needed.',
        input: CollectionQueryInput,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        handler: async (input, { signal }) => {
            const username = store.getState().bgg.user.user;
            if (!username) {
                throw new Error('No BGG user is loaded in ShelfScan; load a collection first with load_bgg_collection');
            }

            const key = username.toLowerCase();
            let collection = store.getState().bgg.collection.users[key];
            if (!collection || Object.keys(collection.items).length === 0) {
                // the collection page loads the saved copy on mount; other pages may not have yet
                const stored = await readStoredCollection(username);
                signal.throwIfAborted();
                if (stored) {
                    dispatch(updateCollectionItems({ username, items: stored }));
                    collection = store.getState().bgg.collection.users[key];
                }
            }

            const items = collection ? Object.values(collection.items) : [];
            if (items.length === 0) {
                throw new Error(`The collection for BGG user ${username} is empty or hasn't been loaded; `
                    + 'load it with load_bgg_collection');
            }

            const { scannedSet, verifiedSet } = getScannedSets(scanHistory);
            const result = runCollectionQuery(items, input, {
                scannedSet,
                verifiedSet,
                tagMap: collection?.tags ?? {},
                tagsByItem: collection?.tagsByItem ?? {},
                lastScannedMap,
            });

            return {
                content: [{ type: 'text', text: describeCollectionQueryResult(result) }],
                structuredContent: { username, ...result },
            };
        },
    });
};

import { setSetting } from '@/app/lib/database/database';
import { useDispatch } from '@/app/lib/hooks';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { fetchFreshBggUserDataWithRetry, identifyBggUser } from '@/app/lib/services/bgg/loadUser';
import { summarizeCollection } from '@/app/lib/services/bgg/service';
import { useMcpTool } from 'webmcp-react';
import { z } from 'zod';

export const BGGLoadCollectionInput = z.object({
    username: z.string()
        .trim()
        .min(1, 'Username must not be blank')
        .describe('BoardGameGeek username whose collection to load'),
});

export const useBGGCollectionTool = () => {
    const dispatch = useDispatch();

    useMcpTool({
        name: 'load_bgg_collection',
        title: 'Load a BGG collection',
        description: 'Fetch a fresh (non-cached) copy of a BoardGameGeek user\'s collection, games and expansions, '
            + 'and make it the active ShelfScan user and collection. Transient BGG errors are retried for up to a minute. '
            + 'Returns a summary of item counts by status.',
        input: BGGLoadCollectionInput,
        annotations: { readOnlyHint: true },
        handler: async ({ username }, { signal }) => {
            const { user, items } = await fetchFreshBggUserDataWithRetry(username, { signal });
            signal.throwIfAborted();

            identifyBggUser(user);
            setSetting('username', username).then();
            dispatch(setBggUser(user));
            dispatch(updateCollectionItems({ username, items }));

            const summary = summarizeCollection(items);
            return {
                content: [{
                    type: 'text',
                    text: `Loaded ${summary.total} items (${summary.games} games, ${summary.expansions} expansions) `
                        + `for BGG user ${user.user}. Status counts: ${JSON.stringify(summary.statuses)}`,
                }],
                structuredContent: { username: user.user, userId: user.id, ...summary },
            };
        },
    });
};

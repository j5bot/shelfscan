import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { addPlay } from '@/app/lib/extension/messaging/addPlay';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { makeUnavailableTool } from '@/app/lib/hooks/webmcp/extension/unavailableTool';
import { useDispatch, useStore } from '@/app/lib/hooks';
import { getCollectionInfoByObjectId } from '@/app/lib/redux/bgg/collection/selectors';
import { todayString } from '@/app/lib/utils/date';
import { makePlayEntries } from '@/app/lib/utils/playEntries';
import { McpToolConfigZod, useMcpTool } from 'webmcp-react';
import { z } from 'zod';

const PlayerInput = z.object({
    name: z.string()
        .min(1)
        .describe('Player name as it should appear on the play'),
    username: z.string()
        .default('')
        .describe('The player\'s BGG username, or empty for a guest player'),
    score: z.string()
        .optional()
        .describe('Final score'),
    win: z.boolean()
        .optional()
        .describe('Whether this player won'),
    color: z.string()
        .optional()
        .describe('Team or color the player used'),
    startPosition: z.number()
        .int()
        .min(1)
        .optional()
        .describe('Starting position, from 1'),
    rating: z.string()
        .optional()
        .describe('The player\'s rating of the game, 1-10'),
});

const AddPlayInput = z.object({
    bggId: z.number()
        .min(1)
        .describe('BoardGameGeek game id'),
    gameName: z.string()
        .min(1)
        .optional()
        .describe('The BGG game name'),
    playdate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
        .optional()
        .describe('Date of the play as YYYY-MM-DD; defaults to today'),
    location: z.string()
        .min(1)
        .optional()
        .describe('Where the game was played'),
    durationMinutes: z.number()
        .int()
        .min(1)
        .optional()
        .describe('How long the play took, in minutes'),
    quantity: z.number()
        .int()
        .min(1)
        .optional()
        .describe('How many times the game was played in this session; defaults to 1'),
    incomplete: z.boolean()
        .optional()
        .describe('Whether the game was not finished'),
    comments: z.string()
        .min(1)
        .optional()
        .describe('Comments about the play'),
    players: z.array(PlayerInput)
        .optional()
        .describe('Who played; leave out for a quick play with no player details'),
});

const TOOL_BASE = {
    name: 'log_bgg_play',
    title: 'Log a play on BGG',
    description: 'Log a play of a game for the logged in BGG user, optionally with date, location, duration, quantity, '
                 + 'comments and players. The browser must have the ShelfScan extension installed and have a '
                 + 'subscription in order to use this tool.',
};

const UNAVAILABLE_TOOL = makeUnavailableTool(TOOL_BASE);

type PlayResponse = {
    error?: boolean;
    message?: string;
    playid?: number | string;
    numplays?: number;
};

// userId and username are the active ShelfScan BGG user (set by bgg_load_collection); the tool is unavailable without them
export const useAddPlayTool = (userId?: string, username?: string) => {
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const dispatch = useDispatch();
    const store = useStore();

    // useMcpTool re-registers when the schema changes and always calls the latest handler,
    // so the config is derived on every render rather than kept in state
    const addPlayConfig: McpToolConfigZod<typeof AddPlayInput> = {
        ...TOOL_BASE,
        input: AddPlayInput,
        annotations: { readOnlyHint: false },
        handler: async (params) => {
            const { bggId, gameName, playdate = todayString(), ...play } = params;
            if (!(userId && username)) {
                throw new Error('No BGG user is loaded in ShelfScan');
            }

            // the play count in the reply is synced to this collection item, when the game is in the collection
            const { collectionId } = getCollectionInfoByObjectId([store.getState(), bggId, undefined]);

            const details = await withExtensionTimeout(Promise.resolve(addPlay({
                entries: makePlayEntries({ playdate, ...play }),
                userId,
                username,
                collectionId,
                bggId,
                name: gameName,
                date: playdate,
                dispatch,
                dispatchExtensionMessage,
            })));

            const response = details?.response as PlayResponse | undefined;
            if (!response || response.error) {
                throw new Error(response?.message
                    ? `BGG did not log the play: ${response.message}`
                    : `The extension did not confirm the play for BGG game ${bggId}`);
            }

            const playCount = response.numplays != null ? `; ${response.numplays} plays logged in total` : '';
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Logged a play of ${gameName ?? `BGG game ${bggId}`} on ${playdate} `
                              + `for BGG user ${username}${playCount}.`,
                    }
                ],
                structuredContent: { playdate, playId: response.playid, numPlays: response.numplays, response },
            };
        },
    };
    const config = (userId && username ? addPlayConfig : UNAVAILABLE_TOOL) as McpToolConfigZod;

    useMcpTool(config);

    return config;
};

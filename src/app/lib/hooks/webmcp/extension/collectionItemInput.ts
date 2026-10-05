import { z } from 'zod';

/**
 * The game and collection item a collection tool acts on. Tools add their own fields with `.extend()`,
 * and can re-describe a shared field for their action, e.g.
 * `CollectionItemInput.extend({ collectionId: CollectionItemInput.shape.collectionId.describe('…') })`.
 */
export const CollectionItemInput = z.object({
    bggId: z.number()
        .min(1)
        .describe('BoardGameGeek game id'),
    gameName: z.string()
        .min(1)
        .optional()
        .describe('The BGG game name'),
    versionId: z.number()
        .min(1)
        .optional()
        .describe('BoardGameGeek game version id'),
    collectionId: z.number()
        .min(1)
        .optional()
        .describe('The user\'s collection item to update; leave out to add a new item'),
});

export type CollectionItemInputValues = z.infer<typeof CollectionItemInput>;

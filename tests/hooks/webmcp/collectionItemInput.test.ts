import { describe, it, expect } from '../../setup';
import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { z } from 'zod';

type JsonSchema = {
    properties: Record<string, { description?: string }>;
    required?: string[];
};

const toJson = (schema: z.ZodType) => z.toJSONSchema(schema, { io: 'input' }) as JsonSchema;

describe('CollectionItemInput', () => {
    it('only requires the BGG game id', () => {
        const json = toJson(CollectionItemInput);
        expect(Object.keys(json.properties)).toEqual(['bggId', 'gameName', 'versionId', 'collectionId']);
        expect(json.required).toEqual(['bggId']);
    });

    it('keeps the shared fields when a tool extends it', () => {
        const extended = CollectionItemInput.extend({ note: z.string() });
        const json = toJson(extended);
        expect(Object.keys(json.properties)).toEqual(['bggId', 'gameName', 'versionId', 'collectionId', 'note']);
        expect(json.required).toEqual(['bggId', 'note']);
    });

    it('lets a tool re-describe a shared field without changing the base', () => {
        const extended = CollectionItemInput.extend({
            collectionId: CollectionItemInput.shape.collectionId.describe('Item to mark for trade'),
        });
        expect(toJson(extended).properties.collectionId.description).toBe('Item to mark for trade');
        expect(toJson(CollectionItemInput).properties.collectionId.description)
            .toBe('The user\'s collection item to update; leave out to add a new item');
    });
});

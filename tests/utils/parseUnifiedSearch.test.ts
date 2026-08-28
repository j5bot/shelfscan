import { describe, it, expect } from '../setup.js';
import { parseUnifiedSearch } from '@/app/lib/hooks/useCollectionFilters';

describe('parseUnifiedSearch — tag negation', () => {
    it('marks a `!#tag` token as negated in tags mode', () => {
        const { tagQueries } = parseUnifiedSearch('!#sleeved', 'tags');
        expect(tagQueries).toEqual([{ tag: '#sleeved', negate: true }]);
    });

    it('marks a `!tag` token (no hash) as negated', () => {
        const { tagQueries } = parseUnifiedSearch('!sleeved', 'tags');
        expect(tagQueries).toEqual([{ tag: '#sleeved', negate: true }]);
    });

    it('leaves a plain tag un-negated', () => {
        const { tagQueries } = parseUnifiedSearch('#pnp', 'tags');
        expect(tagQueries).toEqual([{ tag: '#pnp', negate: false }]);
    });

    it('mixes negated and plain tags', () => {
        const { tagQueries } = parseUnifiedSearch('#pnp !#sleeved', 'tags');
        expect(tagQueries).toEqual([
            { tag: '#pnp', negate: false },
            { tag: '#sleeved', negate: true },
        ]);
    });

    it('parses a negated tag behind the `tags:` prefix in all mode', () => {
        const { tagQueries } = parseUnifiedSearch('tags:!#sleeved', 'all');
        expect(tagQueries).toEqual([{ tag: '#sleeved', negate: true }]);
    });

    it('drops a bare `!` token', () => {
        const { tagQueries } = parseUnifiedSearch('! #pnp', 'tags');
        expect(tagQueries).toEqual([{ tag: '#pnp', negate: false }]);
    });
});

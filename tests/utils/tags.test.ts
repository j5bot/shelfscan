import { describe, it, expect } from '../setup';
import { applyTagChange, extractHashtags, normalizeTag } from '@/app/lib/utils/tags';

describe('extractHashtags', () => {
    it('lowercases tags and adds the bare name of value tags', () => {
        expect(extractHashtags('Great #PnP and #best-at=2')).toEqual(['#pnp', '#best-at=2', '#best-at']);
    });
});

describe('normalizeTag', () => {
    it('adds a missing #', () => {
        expect(normalizeTag(' pnp ')).toBe('#pnp');
        expect(normalizeTag('#pnp')).toBe('#pnp');
    });
});

describe('applyTagChange', () => {
    it('adds tags that are not already there, after the other text', () => {
        expect(applyTagChange('Want the deluxe #PnP', ['pnp', '#solo'], 'add')).toBe('Want the deluxe #PnP #solo');
    });

    it('adds to an empty field', () => {
        expect(applyTagChange(undefined, ['solo'], 'add')).toBe('#solo');
    });

    it('replaces the value of a value tag being added', () => {
        expect(applyTagChange('#best-at=2 #solo', ['#best-at=3'], 'add')).toBe('#solo #best-at=3');
    });

    it('removes tags case-insensitively, with a bare tag removing its value tags', () => {
        expect(applyTagChange('Notes #PnP here #best-at=2 #solo', ['pnp', 'best-at'], 'remove'))
            .toBe('Notes here #solo');
    });

    it('removes only the matching value of a value tag', () => {
        expect(applyTagChange('#best-at=2 #best-at=3', ['#best-at=2'], 'remove')).toBe('#best-at=3');
    });

    it('sets the tags, keeping the other text', () => {
        expect(applyTagChange('Missing card #pnp\n#solo', ['#wip'], 'set')).toBe('Missing card #wip');
        expect(applyTagChange('Missing card #pnp', [], 'set')).toBe('Missing card');
    });
});

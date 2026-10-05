import { describe, it, expect } from '../setup';
import { makePlayEntries } from '@/app/lib/utils/playEntries';

describe('makePlayEntries', () => {
    it('only sends the play date for a quick play', () => {
        expect(makePlayEntries({ playdate: '2026-10-05' })).toEqual({ playdate: '2026-10-05' });
    });

    it('formats the detailed play fields like the detailed play form', () => {
        expect(makePlayEntries({
            playdate: '2026-10-05',
            location: 'Home',
            durationMinutes: 90,
            quantity: 2,
            incomplete: true,
            comments: 'Close game',
        })).toEqual({
            playdate: '2026-10-05',
            location: 'Home',
            duration: '90',
            quantity: '2',
            incomplete: '1',
            comments: 'Close game',
        });
        expect(makePlayEntries({ playdate: '2026-10-05', incomplete: false }).incomplete).toBe('');
    });

    it('sends players as a JSON array', () => {
        const players = [
            { name: 'Ana', username: 'ana', score: '42', win: true },
            { name: 'Guest', username: '' },
        ];
        const entries = makePlayEntries({ playdate: '2026-10-05', players });
        expect(JSON.parse(entries.players)).toEqual(players);
    });

    it('leaves out an empty player list', () => {
        expect(makePlayEntries({ playdate: '2026-10-05', players: [] })).not.toHaveProperty('players');
    });
});

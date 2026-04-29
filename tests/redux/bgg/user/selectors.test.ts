import { describe, it, expect } from '../../../setup.js';
import { getUsername } from '@/app/lib/redux/bgg/user/selectors';
import type { RootState } from '@/app/lib/redux/store';

// ---------------------------------------------------------------------------
// Helper: build a minimal RootState
// ---------------------------------------------------------------------------
const makeState = (user?: string): RootState =>
    ({
        bgg: {
            user: user ? { user } : {},
            collection: { users: {} },
        },
    }) as unknown as RootState;

describe('bgg/user/selectors', () => {
    describe('#getUsername', () => {
        it('returns the username when a user is set', () => {
            expect(getUsername(makeState('alice'))).toBe('alice');
        });

        it('returns undefined when no user is set', () => {
            expect(getUsername(makeState())).toBeUndefined();
        });

        it('returns the exact string stored (case-sensitive)', () => {
            expect(getUsername(makeState('Bob'))).toBe('Bob');
        });
    });
});

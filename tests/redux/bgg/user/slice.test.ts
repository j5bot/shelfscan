import { describe, it, expect } from '../../../setup.js';
import userReducer, { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import type { BggUserSliceState } from '@/app/lib/redux/bgg/user/slice';

describe('bgg/user/slice', () => {
    const emptyState: BggUserSliceState = {};

    describe('#setBggUser', () => {
        it('sets the user when a valid payload is dispatched', () => {
            // Arrange
            const payload = { user: 'alice', firstName: 'Alice', country: 'US' };

            // Act
            const nextState = userReducer(emptyState, setBggUser(payload));

            // Assert
            expect(nextState.user).toEqual('alice');
            expect(nextState.firstName).toEqual('Alice');
            expect(nextState.country).toEqual('US');
        });

        it('resets state to the initial empty object when payload is undefined', () => {
            // Arrange — start from a populated state
            const populated: BggUserSliceState = { user: 'bob', firstName: 'Bob' };

            // Act
            const nextState = userReducer(populated, setBggUser(undefined));

            // Assert
            expect(nextState).toEqual({});
        });

        it('merges partial updates onto the existing state', () => {
            // Arrange
            const existing: BggUserSliceState = { user: 'charlie', firstName: 'Charlie' };

            // Act
            const nextState = userReducer(existing, setBggUser({ lastName: 'Brown' }));

            // Assert
            expect(nextState.user).toEqual('charlie');
            expect(nextState.firstName).toEqual('Charlie');
            expect(nextState.lastName).toEqual('Brown');
        });

        it('overwrites a field when a new value is provided', () => {
            const existing: BggUserSliceState = { user: 'old-user' };
            const nextState = userReducer(existing, setBggUser({ user: 'new-user' }));
            expect(nextState.user).toEqual('new-user');
        });

        it('returns an empty state as the initial state', () => {
            const state = userReducer(undefined, { type: '@@INIT' });
            expect(state).toEqual({});
        });
    });
});

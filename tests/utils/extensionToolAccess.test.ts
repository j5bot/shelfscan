import { describe, it, expect } from '../setup';
import { SyncContextValue } from '@/app/lib/extension/SyncContext';
import { extensionUserMatches, getExtensionToolAccess } from '@/app/lib/utils/extensionToolAccess';

const READY: SyncContextValue = {
    syncOn: true,
    hasSubscription: true,
    userId: '4317241',
    currentUsername: 'ShelfScan',
    extensionUser: 'ShelfScan',
};

const messageFor = (overrides: Partial<SyncContextValue>) =>
    getExtensionToolAccess({ ...READY, ...overrides }).unavailableMessage;

describe('extensionUserMatches', () => {
    it('matches when the extension reports no user', () => {
        expect(extensionUserMatches('ShelfScan', undefined)).toBe(true);
    });

    it('matches usernames case-insensitively', () => {
        expect(extensionUserMatches('shelfscan', 'ShelfScan')).toBe(true);
    });

    it('does not match a different user', () => {
        expect(extensionUserMatches('ShelfScan', 'SomeoneElse')).toBe(false);
    });

    it('does not match when no ShelfScan user is loaded but the extension has one', () => {
        expect(extensionUserMatches(undefined, 'ShelfScan')).toBe(false);
    });
});

describe('getExtensionToolAccess', () => {
    it('gives the user when the extension can be used', () => {
        expect(getExtensionToolAccess(READY)).toEqual({
            canUseExtension: true,
            userId: '4317241',
            username: 'ShelfScan',
        });
    });

    it('can be used when the extension reports no BGG user', () => {
        expect(getExtensionToolAccess({ ...READY, extensionUser: undefined }).canUseExtension).toBe(true);
    });

    it('withholds the user when the extension can\'t be used', () => {
        expect(getExtensionToolAccess({ ...READY, syncOn: false })).toEqual({
            canUseExtension: false,
            unavailableMessage: expect.stringMatching(/extension is not installed/),
        });
    });

    it('explains a missing subscription', () => {
        expect(messageFor({ hasSubscription: false })).toMatch(/requires a ShelfScan extension subscription/);
    });

    it('explains a subscription check that hasn\'t finished', () => {
        expect(messageFor({ hasSubscription: undefined })).toMatch(/still checking/);
    });

    it('explains a missing ShelfScan user', () => {
        expect(messageFor({ userId: undefined, currentUsername: undefined })).toMatch(/no BGG user is loaded/);
    });

    it('names both users when the extension user doesn\'t match', () => {
        const message = messageFor({ extensionUser: 'SomeoneElse' });
        expect(message).toMatch(/logged in to BGG as "SomeoneElse"/);
        expect(message).toMatch(/loaded in ShelfScan is "ShelfScan"/);
    });

    it('reports the missing extension before anything else', () => {
        expect(messageFor({ syncOn: false, hasSubscription: false, extensionUser: 'SomeoneElse' }))
            .toMatch(/extension is not installed/);
    });
});

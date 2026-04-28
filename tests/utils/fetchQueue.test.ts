import { describe, it, expect, beforeEach, afterEach } from '../setup.js';
import { vi } from 'vitest';

describe('fetchQueue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Reset module between tests so the queue/draining state is fresh
        vi.resetModules();
    });

    afterEach(async () => {
        await vi.runAllTimersAsync();
        vi.useRealTimers();
    });

    it('resolves a single enqueued fetch with the returned value', async () => {
        const { enqueueFetch } = await import('@/app/lib/utils/fetchQueue');
        const result = await enqueueFetch(() => Promise.resolve(42));
        expect(result).toBe(42);
    });

    it('resolves with a string value', async () => {
        const { enqueueFetch } = await import('@/app/lib/utils/fetchQueue');
        const result = await enqueueFetch(() => Promise.resolve('hello'));
        expect(result).toBe('hello');
    });

    it('rejects when the fetch function rejects', async () => {
        const { enqueueFetch } = await import('@/app/lib/utils/fetchQueue');
        await expect(
            enqueueFetch(() => Promise.reject(new Error('network error'))),
        ).rejects.toThrow('network error');
    });

    it('rejects when the fetch function throws synchronously', async () => {
        const { enqueueFetch } = await import('@/app/lib/utils/fetchQueue');
        await expect(
            enqueueFetch(() => {
                throw new Error('sync error');
            }),
        ).rejects.toThrow('sync error');
    });

    it('executes two fetches in order with a 300 ms throttle between them', async () => {
        const { enqueueFetch } = await import('@/app/lib/utils/fetchQueue');
        const order: string[] = [];

        const p1 = enqueueFetch<string>(() => {
            order.push('first');
            return Promise.resolve('a');
        });
        const p2 = enqueueFetch<string>(() => {
            order.push('second');
            return Promise.resolve('b');
        });

        // The first fetch runs immediately; await it before checking order
        const r1 = await p1;
        expect(r1).toBe('a');
        expect(order).toEqual(['first']); // second has not run yet

        // Advance past the 300 ms throttle so the second fetch can execute
        await vi.advanceTimersByTimeAsync(300);
        const r2 = await p2;
        expect(r2).toBe('b');
        expect(order).toEqual(['first', 'second']);
    });
});

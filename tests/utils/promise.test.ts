import { describe, it, expect } from '../setup';
import { createResolvers } from '@/app/lib/utils/promise';

describe('createResolvers', () => {
    it('resolves the promise from outside', async () => {
        const { promise, resolve } = createResolvers<number>();
        resolve(42);
        await expect(promise).resolves.toBe(42);
    });

    it('rejects the promise from outside', async () => {
        const { promise, reject } = createResolvers<number>();
        reject(new Error('nope'));
        await expect(promise).rejects.toThrow('nope');
    });

    it('works where Promise.withResolvers is missing', async () => {
        const original = Promise.withResolvers;
        // @ts-expect-error simulating Safari < 17.4
        delete Promise.withResolvers;
        try {
            const { promise, resolve } = createResolvers<string>();
            resolve('ok');
            await expect(promise).resolves.toBe('ok');
        } finally {
            Promise.withResolvers = original;
        }
    });
});

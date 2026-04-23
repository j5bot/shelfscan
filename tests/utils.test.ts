import { describe, it, expect, beforeEach, afterEach } from './setup.js';
import { vi } from 'vitest';
import { textFetchAndWait } from '@/app/lib/utils';

// Mock sleep-promise so tests run instantly
vi.mock('sleep-promise', () => ({
    default: vi.fn().mockResolvedValue(undefined),
}));

describe('textFetchAndWait', () => {
    const url = 'https://api.example.com/data';

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('#textFetchAndWait', () => {
        it('resolves with text when the response does not contain an error message', async () => {
            // Arrange
            const mockFetch = vi.fn().mockResolvedValue({
                text: () => Promise.resolve('<items><item>Hello</item></items>'),
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act
            const result = await textFetchAndWait(url);

            // Assert
            expect(result).toEqual('<items><item>Hello</item></items>');
            expect(mockFetch).toHaveBeenCalledOnce();
        });

        it('retries when the response contains both <error and <message', async () => {
            // Arrange — first call returns error/message, second returns valid XML
            const errorXml = '<errors><error><message>Please try again later</message></error></errors>';
            const successXml = '<items></items>';

            const mockFetch = vi.fn()
                .mockResolvedValueOnce({ text: () => Promise.resolve(errorXml) })
                .mockResolvedValueOnce({ text: () => Promise.resolve(successXml) });
            vi.stubGlobal('fetch', mockFetch);

            // Act
            const result = await textFetchAndWait(url);

            // Assert
            expect(result).toEqual(successXml);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('throws an error after exceeding maxRetries', async () => {
            // Arrange — always returns error XML; start at depth=16 so the guard triggers immediately
            const errorXml = '<errors><error><message>Please try again</message></error></errors>';
            const mockFetch = vi.fn().mockResolvedValue({
                text: () => Promise.resolve(errorXml),
            });
            vi.stubGlobal('fetch', mockFetch);

            // Act & Assert — depth 16 > maxRetries(15), so it throws on the first attempt
            await expect(textFetchAndWait(url, 16)).rejects.toThrow(
                `Failed to fetch ${url} after 17 tries`,
            );
        });

        it('passes the depth argument through correctly on retry', async () => {
            // Arrange — start from depth 14 (one away from threshold)
            const errorXml = '<errors><error><message>retry</message></error></errors>';
            const successXml = '<data />';
            const mockFetch = vi.fn()
                .mockResolvedValueOnce({ text: () => Promise.resolve(errorXml) })
                .mockResolvedValueOnce({ text: () => Promise.resolve(successXml) });
            vi.stubGlobal('fetch', mockFetch);

            const result = await textFetchAndWait(url, 14);
            expect(result).toEqual(successXml);
        });
    });
});

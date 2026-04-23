import { describe, it, expect } from '../setup.js';
import { formatBytes } from '@/app/lib/utils/size';

describe('size utils', () => {
    describe('#formatBytes', () => {
        it('returns "0 Bytes" for 0 bytes', () => {
            expect(formatBytes(0)).toEqual('0 Bytes');
        });

        it('formats bytes correctly (no division needed)', () => {
            expect(formatBytes(1)).toEqual('1.00 Bytes');
        });

        it('formats kilobytes correctly', () => {
            expect(formatBytes(1000)).toEqual('1.00 KB');
        });

        it('formats megabytes correctly', () => {
            expect(formatBytes(1_000_000)).toEqual('1.00 MB');
        });

        it('formats gigabytes correctly', () => {
            expect(formatBytes(1_000_000_000)).toEqual('1.00 GB');
        });

        it('respects a custom decimal places argument', () => {
            expect(formatBytes(1500, 0)).toEqual('2 KB');
        });

        it('clamps negative decimals to 0', () => {
            expect(formatBytes(1000, -3)).toEqual('1 KB');
        });

        it('handles the default 2-decimal precision for non-round values', () => {
            expect(formatBytes(1500)).toEqual('1.50 KB');
        });

        it('formats terabytes correctly', () => {
            expect(formatBytes(1_000_000_000_000)).toEqual('1.00 TB');
        });
    });
});

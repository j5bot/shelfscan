import { describe, it, expect } from '../setup';
import { clampCashValue } from '@/app/lib/utils/trade';

describe('clampCashValue', () => {
    it('leaves an unset value unset', () => {
        expect(clampCashValue(undefined)).toBeUndefined();
    });

    it('keeps zero and positive values', () => {
        expect(clampCashValue(0)).toBe(0);
        expect(clampCashValue(25)).toBe(25);
    });

    it('clamps negative values to zero', () => {
        expect(clampCashValue(-1)).toBe(0);
        expect(clampCashValue(-30)).toBe(0);
    });
});

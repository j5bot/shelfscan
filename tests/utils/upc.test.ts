import { describe, it, expect } from '../setup.js';
import {
    expandUPCE,
    isValidUPCA,
    isValidUPCE,
    upcCheckDigit,
} from '@/app/lib/utils/upc';

describe('upc utils', () => {
    describe('upcCheckDigit', () => {
        it('computes the UPC-A check digit', () => {
            expect(upcCheckDigit('03600029145')).toBe(2);
            expect(upcCheckDigit('04210000526')).toBe(4);
        });
    });

    describe('isValidUPCA', () => {
        it('accepts a 12-digit UPC-A with a correct check digit', () => {
            expect(isValidUPCA('036000291452')).toBe(true);
        });

        it('rejects a wrong check digit', () => {
            expect(isValidUPCA('036000291453')).toBe(false);
        });

        it('rejects the wrong length or non-digits', () => {
            expect(isValidUPCA('03600029145')).toBe(false);
            expect(isValidUPCA('0360002914520')).toBe(false);
            expect(isValidUPCA('03600029145a')).toBe(false);
        });
    });

    describe('expandUPCE', () => {
        it.each([
            ['01234505', '012000003455'],
            ['01234531', '012300000451'],
            ['01234543', '012340000053'],
            ['01234558', '012345000058'],
            ['04252614', '042100005264'],
        ])('expands %s to %s', (upce, upca) => {
            expect(expandUPCE(upce)).toBe(upca);
        });
    });

    describe('isValidUPCE', () => {
        it('accepts a UPC-E whose expansion has a correct check digit', () => {
            expect(isValidUPCE('04252614')).toBe(true);
            expect(isValidUPCE('01234558')).toBe(true);
        });

        it('rejects a wrong check digit', () => {
            expect(isValidUPCE('04252615')).toBe(false);
        });

        it('rejects number systems other than 0 or 1 and wrong lengths', () => {
            expect(isValidUPCE('24252614')).toBe(false);
            expect(isValidUPCE('0425261')).toBe(false);
        });
    });
});

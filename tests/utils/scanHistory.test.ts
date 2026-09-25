import { describe, it, expect } from '../setup';
import { findRecentDuplicate } from '@/app/lib/utils/scanHistory';
import { ScanHistoryEntry } from '@/app/lib/types/scanHistory';

const entry = (upc: string, timestamp: number) => ({ upc, timestamp }) as ScanHistoryEntry;

describe('findRecentDuplicate', () => {
    const nowSecs = 1_760_000_000;

    it('finds the same UPC scanned within five minutes', () => {
        const recent = entry('111', nowSecs - 60);
        expect(findRecentDuplicate([entry('222', nowSecs), recent], '111', nowSecs)).toBe(recent);
    });

    it('ignores the same UPC scanned more than five minutes ago', () => {
        expect(findRecentDuplicate([entry('111', nowSecs - 301)], '111', nowSecs)).toBeUndefined();
    });

    it('ignores other UPCs', () => {
        expect(findRecentDuplicate([entry('222', nowSecs)], '111', nowSecs)).toBeUndefined();
    });
});

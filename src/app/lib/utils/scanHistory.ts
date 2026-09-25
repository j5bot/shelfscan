import { ScanHistoryEntry } from '@/app/lib/types/scanHistory';

export const DUPLICATE_WINDOW_SECS = 5 * 60; // 5 minutes

/** Finds an entry for the same UPC scanned within the duplicate window (timestamps are in seconds). */
export const findRecentDuplicate = (
    history: ScanHistoryEntry[],
    upc: string,
    nowSecs: number,
) => history.find(
    entry => entry.upc === upc && (nowSecs - entry.timestamp) < DUPLICATE_WINDOW_SECS,
);

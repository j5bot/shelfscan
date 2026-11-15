import { ScanHistoryEntry } from '@/app/lib/types/scanHistory';

export type ScannedSets = {
    // BGG ids with at least one scan
    scannedSet: Set<number>;
    // BGG ids with at least one verified scan
    verifiedSet: Set<number>;
};

export const getScannedSets = (scanHistory: ScanHistoryEntry[]): ScannedSets => {
    const scannedSet = new Set<number>();
    const verifiedSet = new Set<number>();
    for (const entry of scanHistory) {
        if (entry.bggId === undefined) {
            continue;
        }
        scannedSet.add(entry.bggId);
        if (entry.verified) {
            verifiedSet.add(entry.bggId);
        }
    }
    return { scannedSet, verifiedSet };
};

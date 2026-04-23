'use client';

import {
    addScanHistoryEntry,
    associateAnonymousScans,
    clearScanHistory,
    database,
    getScanHistory,
    getScanHistoryCount,
    updateScanHistoryEntry,
} from '@/app/lib/database/database';
import {
    SCAN_HISTORY_SCHEMA_VERSION,
    ScanHistoryEntry,
    ScanHistoryError,
    ScanHistoryMatchStatus,
} from '@/app/lib/types/scanHistory';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

const MAX_SCAN_HISTORY = 20_000;
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

type RecordScanOptions = {
    upc: string;
    username?: string;
    gameName?: string;
    status?: ScanHistoryMatchStatus;
    bggId?: number;
    thumbnailUrl?: string;
    error?: ScanHistoryError;
    verified?: boolean;
    collectionIds?: number[];
    collectionStatuses?: Record<number, Record<string, boolean>>;
};

type UpdateScanOptions = {
    status?: ScanHistoryMatchStatus;
    verified?: boolean;
    gameName?: string;
    bggId?: number;
    thumbnailUrl?: string;
    error?: ScanHistoryError;
    collectionIds?: number[];
    collectionStatuses?: Record<number, Record<string, boolean>>;
    username?: string;
};

type RecordScanResult =
    | { kind: 'added'; id: number }
    | { kind: 'duplicate'; previousEntry: ScanHistoryEntry }
    | { kind: 'limitReached' };

type ScanHistoryContextValue = {
    scanHistory: ScanHistoryEntry[];
    unmatchedScans: ScanHistoryEntry[];
    recordScan: (opts: RecordScanOptions) => Promise<RecordScanResult>;
    updateEntry: (id: number, updates: UpdateScanOptions) => Promise<void>;
    clearHistory: () => Promise<void>;
    associateScans: (username: string) => Promise<number>;
};

const ScanHistoryContext = createContext<ScanHistoryContextValue>({
    scanHistory: [],
    unmatchedScans: [],
    recordScan: async () => ({ kind: 'limitReached' }),
    updateEntry: async () => undefined,
    clearHistory: async () => undefined,
    associateScans: async () => 0,
});

export const useScanHistory = () => useContext(ScanHistoryContext);

const pruneOldUnmatched = async (entries: ScanHistoryEntry[]): Promise<ScanHistoryEntry[]> => {
    const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const toDelete = entries.filter(
        e => e.status === ScanHistoryMatchStatus.unmatched && e.timestamp < oneMonthAgo,
    );
    if (toDelete.length === 0) {
        return entries;
    }
    const ids = toDelete.map(e => e.id!).filter(Boolean);
    await database.scanHistory.bulkDelete(ids);
    return entries.filter(e => !toDelete.includes(e));
};

export const ScanHistoryProvider = ({ children }: { children: ReactNode }) => {
    const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

    const loadHistory = useCallback(async () => {
        const entries = await getScanHistory();
        setScanHistory(entries);
    }, []);

    useEffect(() => {
        loadHistory().then();
    }, [loadHistory]);

    const recordScan = useCallback(async (opts: RecordScanOptions): Promise<RecordScanResult> => {
        const now = Date.now();
        const nowSecs = Math.floor(now / 1000);

        // Duplicate check: same UPC within 5 minutes
        const recentDuplicate = scanHistory.find(
            e => e.upc === opts.upc && (now - e.timestamp * 1000) < DUPLICATE_WINDOW_MS,
        );
        if (recentDuplicate) {
            return { kind: 'duplicate', previousEntry: recentDuplicate };
        }

        // Data retention: prune before adding
        let currentCount = await getScanHistoryCount();
        let currentHistory = scanHistory;
        if (currentCount >= MAX_SCAN_HISTORY) {
            currentHistory = await pruneOldUnmatched(currentHistory);
            currentCount = currentHistory.length;
            if (currentCount >= MAX_SCAN_HISTORY) {
                return { kind: 'limitReached' };
            }
            setScanHistory(currentHistory);
        }

        const entry: Omit<ScanHistoryEntry, 'id'> = {
            upc: opts.upc,
            timestamp: nowSecs,
            updatedAt: nowSecs,
            status: ScanHistoryMatchStatus.unmatched,
            verified: opts.verified ?? false,
            schemaVersion: SCAN_HISTORY_SCHEMA_VERSION,
            ...(opts.gameName !== undefined && { gameName: opts.gameName }),
            ...(opts.bggId !== undefined && { bggId: opts.bggId }),
            ...(opts.thumbnailUrl !== undefined && { thumbnailUrl: opts.thumbnailUrl }),
            ...(opts.collectionIds !== undefined && { collectionIds: opts.collectionIds }),
            ...(opts.collectionStatuses !== undefined && { collectionStatuses: opts.collectionStatuses }),
            ...(opts.username !== undefined && { username: opts.username }),
        };

        const id = await addScanHistoryEntry(entry);
        if (id === undefined) {
            return { kind: 'limitReached' };
        }
        setScanHistory(prev => [{ ...entry, id }, ...prev]);
        return { kind: 'added', id };
    }, [scanHistory]);

    const updateEntry = useCallback(async (id: number, updates: UpdateScanOptions) => {
        await updateScanHistoryEntry(id, updates);
        setScanHistory(prev =>
            prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: Math.floor(Date.now() / 1000) } : e),
        );
    }, []);

    const clearHistory = useCallback(async () => {
        await clearScanHistory();
        setScanHistory([]);
    }, []);

    const associateScans = useCallback(async (username: string): Promise<number> => {
        const updatedAt = Math.floor(Date.now() / 1000);
        const count = await associateAnonymousScans(username);
        setScanHistory(prev =>
            prev.map(e => !e.username ? { ...e, username, updatedAt } : e),
        );
        return count;
    }, []);

    const unmatchedScans = scanHistory.filter(
        e => e.status === ScanHistoryMatchStatus.unmatched,
    );

    return <ScanHistoryContext.Provider value={{
        scanHistory,
        unmatchedScans,
        recordScan,
        updateEntry,
        clearHistory,
        associateScans,
    }}>
        {children}
    </ScanHistoryContext.Provider>;
};

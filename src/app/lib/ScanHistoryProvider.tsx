import {
    addScanHistoryEntry,
    clearScanHistory,
    getScanHistory,
    updateScanHistoryStatus,
} from '@/app/lib/database/database';
import { type ScanHistoryEntry, type ScanHistoryStatus } from '@/app/lib/types/scanHistory';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type ScanHistoryContextValue = {
    scanHistory: ScanHistoryEntry[];
    unmatchedScans: ScanHistoryEntry[];
    recordScan: (upc: string) => Promise<number | undefined>;
    updateStatus: (id: number, status: ScanHistoryStatus) => Promise<void>;
    clearHistory: () => Promise<void>;
};

const ScanHistoryContext = createContext<ScanHistoryContextValue>({
    scanHistory: [],
    unmatchedScans: [],
    recordScan: async () => undefined,
    updateStatus: async () => undefined,
    clearHistory: async () => undefined,
});

export const useScanHistory = () => useContext(ScanHistoryContext);

export const ScanHistoryProvider = ({ children }: { children: ReactNode }) => {
    const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

    const loadHistory = useCallback(async () => {
        const entries = await getScanHistory();
        setScanHistory(entries);
    }, []);

    useEffect(() => {
        loadHistory().then();
    }, [loadHistory]);

    const recordScan = useCallback(async (upc: string) => {
        const timestamp = Date.now();
        const id = await addScanHistoryEntry({
            upc,
            timestamp,
            status: 'unmatched',
        });
        setScanHistory(prev => [{ id, upc, timestamp, status: 'unmatched' }, ...prev]);
        return id;
    }, []);

    const updateStatus = useCallback(async (id: number, status: ScanHistoryStatus) => {
        await updateScanHistoryStatus(id, status);
        setScanHistory(prev =>
            prev.map(entry => entry.id === id ? { ...entry, status } : entry),
        );
    }, []);

    const clearHistory = useCallback(async () => {
        await clearScanHistory();
        setScanHistory([]);
    }, []);

    const unmatchedScans = scanHistory.filter(entry => entry.status === 'unmatched');

    return <ScanHistoryContext.Provider value={{
        scanHistory,
        unmatchedScans,
        recordScan,
        updateStatus,
        clearHistory,
    }}>
        {children}
    </ScanHistoryContext.Provider>;
};

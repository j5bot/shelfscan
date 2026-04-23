export type ScanHistoryStatus = 'matched' | 'unmatched';

export type ScanHistoryEntry = {
    id?: number;
    upc: string;
    timestamp: number;
    status: ScanHistoryStatus;
    bggId?: number;
};

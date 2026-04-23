// Match status enum: 0 = unmatched, 1 = matched, 2 = duplicate
export const ScanHistoryMatchStatus = {
    unmatched: 0,
    matched: 1,
    duplicate: 2,
} as const;
export type ScanHistoryMatchStatus = typeof ScanHistoryMatchStatus[keyof typeof ScanHistoryMatchStatus];

// Error enum: 0 = no error, 1 = not found, 2 = verification failed, 255 = other
export const ScanHistoryError = {
    none: 0,
    notFound: 1,
    verificationFailed: 2,
    other: 255,
} as const;
export type ScanHistoryError = typeof ScanHistoryError[keyof typeof ScanHistoryError];

export const SCAN_HISTORY_SCHEMA_VERSION = 1;

export type ScanHistoryEntry = {
    id?: number;
    upc: string;
    timestamp: number;
    updatedAt: number;
    status: ScanHistoryMatchStatus;
    verified: boolean;
    schemaVersion: number;
    gameName?: string;
    bggId?: number;
    thumbnailUrl?: string;
    error?: ScanHistoryError;
    collectionIds?: number[];
    collectionStatuses?: Record<number, Record<string, boolean>>;
    username?: string;
};

// Legacy string alias kept for backwards compat during migration
export type ScanHistoryStatus = 'matched' | 'unmatched';

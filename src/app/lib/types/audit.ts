import { BggCollectionStatuses } from '@/app/lib/types/bgg';

export type AuditEntry = {
    id: number;
    upc?: string;
    collectionId?: number;
    gameId: number;
    versionId?: number;
    statuses: BggCollectionStatuses;
    rated?: boolean;
    timestamp: number;
};

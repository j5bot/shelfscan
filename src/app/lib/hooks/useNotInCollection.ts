import { ScanHistoryEntry } from '@/app/lib/types/scanHistory';
import { useMemo } from 'react';

export type NotInCollectionEntry = {
    id: number;
    upc: string;
    bggId?: number;
    gameName?: string;
    thumbnailUrl?: string;
    timestamp: number;
};

type UseNotInCollectionResult = {
    /**
     * Deduplicated list of scan history entries for games not found in the BGG collection.
     * Items with a bggId are deduped by bggId (most recent scan wins).
     * Items without a bggId are deduped by UPC.
     */
    notInCollectionItems: NotInCollectionEntry[];
    /**
     * True when the user has a BGG collection loaded (even if empty).
     * False means the collection has never been fetched, so we show a refresh prompt.
     */
    collectionHasData: boolean;
};

/**
 * Computes the list of scanned games that are not present in the user's BGG collection.
 *
 * @param collectionObjectIds - Set of BGG objectIds present in the user's collection
 * @param scanHistory - all entries from the ScanHistoryProvider
 * @param collectionIsLoaded - whether the collection has been fetched (even if empty)
 */
export const useNotInCollection = (
    collectionObjectIds: Set<number> | undefined,
    scanHistory: ScanHistoryEntry[],
    collectionIsLoaded: boolean,
): UseNotInCollectionResult => {
    const notInCollectionItems = useMemo<NotInCollectionEntry[]>(() => {
        if (!collectionIsLoaded || scanHistory.length === 0) {
            return [];
        }

        // Entries with bggId: check against collection; dedup by bggId (newest first)
        const byBggId = new Map<number, ScanHistoryEntry>();
        // Entries without bggId: dedup by UPC (newest first)
        const byUpc = new Map<string, ScanHistoryEntry>();

        for (const entry of scanHistory) {
            if (entry.bggId !== undefined) {
                // Only add if this bggId is NOT in the collection
                if (collectionObjectIds?.has(entry.bggId)) { continue; }
                const existing = byBggId.get(entry.bggId);
                if (!existing || entry.timestamp > existing.timestamp) {
                    byBggId.set(entry.bggId, entry);
                }
            } else {
                // No bggId — include as unmatched, dedup by UPC
                const existing = byUpc.get(entry.upc);
                if (!existing || entry.timestamp > existing.timestamp) {
                    byUpc.set(entry.upc, entry);
                }
            }
        }

        const toEntry = (e: ScanHistoryEntry): NotInCollectionEntry | undefined => {
            if (e.id === undefined) { return undefined; }
            return {
                id: e.id,
                upc: e.upc,
                bggId: e.bggId,
                gameName: e.gameName,
                thumbnailUrl: e.thumbnailUrl,
                timestamp: e.timestamp,
            };
        };

        return [
            ...Array.from(byBggId.values()).map(toEntry).filter((e): e is NotInCollectionEntry => e !== undefined),
            ...Array.from(byUpc.values()).map(toEntry).filter((e): e is NotInCollectionEntry => e !== undefined),
        ];
    }, [collectionObjectIds, scanHistory, collectionIsLoaded]);

    return {
        notInCollectionItems,
        collectionHasData: collectionIsLoaded,
    };
};

import { useBatchSync } from '@/app/lib/extension/useBatchSync';
import { useStore } from '@/app/lib/hooks';
import { NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { getCollectionInfoByObjectId } from '@/app/lib/redux/bgg/collection/selectors';
import { type GameUPCBggInfo } from 'gameupc-hooks/types';
import { useCallback, useMemo, useRef, useState } from 'react';

const ADDED_TOAST_MS = 5000;

const entryToInfo = (entry: NotInCollectionEntry): GameUPCBggInfo => ({
    id: entry.bggId!,
    name: entry.gameName ?? entry.upc,
    confidence: 100,
    thumbnail_url: entry.thumbnailUrl ?? '',
    page_url: `https://boardgamegeek.com/boardgame/${entry.bggId}`,
    image_url: entry.thumbnailUrl ?? '',
    data_url: '',
    update_url: '',
    version_status: 'none',
    versions: [],
});

/** Select scanned games that aren't in the collection and add them to BGG via the extension. */
export const useAddToCollectionSelection = (notInCollectionItems: NotInCollectionEntry[]) => {
    const store = useStore();
    const { canBatch, addGameToCollection } = useBatchSync();

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [addedNames, setAddedNames] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const addToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedEntries = useMemo(
        () => notInCollectionItems.filter(e => selectedIds.has(e.id) && e.bggId !== undefined),
        [notInCollectionItems, selectedIds],
    );

    const toggleSelectionMode = useCallback(() => {
        setSelectionMode(v => !v);
        setSelectedIds(new Set());
    }, []);

    const toggleSelection = useCallback((entry: NotInCollectionEntry) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(entry.id)) {
                next.delete(entry.id);
            } else {
                next.add(entry.id);
            }
            return next;
        });
    }, []);

    const requestAdd = useCallback(() => {
        if (selectedIds.size === 0) { return; }
        setShowConfirmModal(true);
    }, [selectedIds.size]);

    const cancelAdd = useCallback(() => setShowConfirmModal(false), []);
    const clearAddedNames = useCallback(() => setAddedNames([]), []);

    const addSelected = useCallback(async () => {
        setShowConfirmModal(false);
        setIsAdding(true);

        const reduxState = store.getState();
        const promises = selectedEntries.map(entry => {
            const { collectionId } = getCollectionInfoByObjectId([reduxState, entry.bggId!, undefined]);
            return addGameToCollection(entryToInfo(entry), undefined, collectionId)?.then(
                result => result ? (entry.gameName ?? entry.upc) : undefined,
            );
        });

        const results = await Promise.all(promises);
        const names = results.filter((r): r is string => r !== undefined);

        setIsAdding(false);
        setSelectionMode(false);
        setSelectedIds(new Set());

        if (names.length > 0) {
            setAddedNames(names);
            if (addToastTimerRef.current !== null) { clearTimeout(addToastTimerRef.current); }
            addToastTimerRef.current = setTimeout(() => {
                addToastTimerRef.current = null;
                setAddedNames([]);
            }, ADDED_TOAST_MS);
        }
    }, [selectedEntries, store, addGameToCollection]);

    return {
        canBatch,
        selectionMode,
        selectedIds,
        selectedEntries,
        showConfirmModal,
        isAdding,
        addedNames,
        toggleSelectionMode,
        toggleSelection,
        requestAdd,
        cancelAdd,
        addSelected,
        clearAddedNames,
    };
};

import { useStore } from '@/app/lib/hooks';
import {
    getCollectionInfoByObjectId,
} from '@/app/lib/redux/bgg/collection/selectors';
import { GameUPCBggInfo, GameUPCData } from 'gameupc-hooks/types';
import React, { useCallback, useState } from 'react';
import { FaCloudArrowUp } from 'react-icons/fa6';

type BatchAddButtonProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
    addGameToCollection: (info: GameUPCBggInfo, collectionId: number | undefined) => void | Promise<boolean>;
    onComplete?: (addedCodes: string[]) => void;
};

export const BatchAddButton = (props: BatchAddButtonProps) => {
    const { codes, gameUPCResults, addGameToCollection, onComplete } = props;
    const [isAdding, setIsAdding] = useState(false);

    const store = useStore();

    const readyGames = codes.filter(code => {
        const data = gameUPCResults[code];
        return data?.bgg_info?.[0]?.id;
    });

    const handleAddAll = useCallback(async () => {
        if (isAdding || readyGames.length === 0) {
            return;
        }
        setIsAdding(true);

        const state = store.getState();
        const promises = readyGames.map(code => {
            const info = gameUPCResults[code]?.bgg_info?.[0];
            if (!info) {
                return;
            }
            const { collectionId } =
                getCollectionInfoByObjectId([state, info.id]);

            return addGameToCollection(info, collectionId)?.then(success => success ? `${info.name} (${code})` : undefined);
        }).filter(Boolean);

        Promise.all(promises).then(results => {
            onComplete?.(results.filter(r => r !== undefined));
            setIsAdding(false);
        });
    }, [isAdding, readyGames, gameUPCResults, store, addGameToCollection, onComplete]);

    const pendingCount = codes.length - readyGames.length;

    return <div className="flex flex-col items-center gap-2 w-full">
        <button
            className={`btn rounded-full
                bg-[#e07ca4] text-white
                flex items-center justify-center gap-2
                uppercase text-lg font-sharetech
                pl-6 pr-6 pt-2 pb-2
                ${readyGames.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#d06b93]'}`}
            disabled={readyGames.length === 0 || isAdding}
            onClick={handleAddAll}
        >
            {isAdding ? <span className="loading loading-bars loading-sm" /> : <FaCloudArrowUp className="w-5 h-5" />}
            Add {readyGames.length} Game{readyGames.length !== 1 ? 's' : ''} to Collection
        </button>
        {pendingCount > 0 && <div className="text-xs text-gray-500">
            {pendingCount} game{pendingCount !== 1 ? 's' : ''} still loading...
        </div>}
    </div>;
};


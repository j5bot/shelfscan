import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useStore } from '@/app/lib/hooks';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { downloadSwapExport } from '@/app/lib/utils/swapExport';
import React, { useCallback, useState } from 'react';
import { FaCloudArrowUp } from 'react-icons/fa6';

type SwapAddButtonProps = {
    codes: string[];
};

export const SwapAddButton = (props: SwapAddButtonProps) => {
    const { gameDataMap } = useGameUPCData();
    const { gameSelections } = useGameSelections();

    const { codes } = props;
    const [isAdding, setIsAdding] = useState(false);

    const store = useStore();

    const readyGames = codes.filter(code => {
        const data = gameDataMap[code];
        return data?.bgg_info?.[0]?.id;
    });

    const handleAddAll = useCallback(async () => {
        if (isAdding || readyGames.length === 0) {
            return;
        }
        setIsAdding(true);

        const state = store.getState();

        const items: SwapItemData[] = [];
        const addedCodes: string[] = [];

        readyGames.forEach(code => {
            const savedData = state.swap.data[code];

            items.push({
                collectionId: code,
                swapItemId: savedData?.swapItemId,
                name: savedData?.name ?? '',
                bodyText: savedData?.bodyText ?? '',
                compareValue: savedData?.compareValue ?? 1,
                sellFor: savedData?.sellFor ?? 0,
                imageKey: savedData?.imageKey,
            });
            addedCodes.push(code);
        });

        try {
            await downloadSwapExport(items);
        } finally {
            setIsAdding(false);
        }
    }, [isAdding, readyGames, gameDataMap, store, gameSelections]);

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
            Add {readyGames.length} Game{readyGames.length !== 1 ? 's' : ''} to Swap
        </button>
        {pendingCount > 0 && <div className="text-xs text-gray-500">
            {pendingCount} game{pendingCount !== 1 ? 's' : ''} still loading...
        </div>}
    </div>;
};


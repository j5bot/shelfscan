import { thingPrefix, versionPrefix } from '@/app/lib/constants';
import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector, useStore } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { downloadSwapExport } from '@/app/lib/utils/swapExport';
import React, { useCallback, useState } from 'react';
import { FaFileExport } from 'react-icons/fa6';

type SwapAddButtonProps = {
    codes: string[];
};

const makeDescription = (
    bodyText: string,
    gameData: Array<{ id: number; name: string } | undefined>
) => {
    return `${bodyText}
${gameData[0] !== undefined ? `
${thingPrefix}${gameData[0].id}` : ''}${gameData[1] !== undefined ? `
${versionPrefix}${gameData[1].id}` : ''}`;
};

export const SwapAddButton = (props: SwapAddButtonProps) => {
    const { gameDataMap } = useGameUPCData();
    const { gameSelections } = useGameSelections();

    const { codes } = props;
    const [isAdding, setIsAdding] = useState(false);

    const saved = useSelector((state: RootState) => state.swap.data);
    
    const swappableGames = codes.filter(code => {
        if (saved[code]?.bodyText.length === 0) {
            return false;
        }
        const data = gameDataMap[code];
        return data?.bgg_info?.[0]?.id;
    });

    const readyGames = codes.filter(code => {
        const data = gameDataMap[code];
        return data?.bgg_info?.[0]?.id;
    });

    const handleAddAll = useCallback(async () => {
        if (isAdding || swappableGames.length === 0) {
            return;
        }
        setIsAdding(true);

        const items: SwapItemData[] = [];
        const addedCodes: string[] = [];

        const readyGamesData = swappableGames.map(code => {
            const data = gameDataMap[code];
            const selections = gameSelections[code];
            let infoIndex = selections?.[0] ?
                            data?.bgg_info?.findIndex(info => info.id === selections?.[0])
                            : 0;
            const versionIndex = selections?.[1] ? data?.bgg_info?.[infoIndex ?? 0]?.versions?.findIndex(version =>
                version.version_id === selections?.[1]) : undefined;
            infoIndex = infoIndex >= 0 ? infoIndex : 0;

            const info = data?.bgg_info?.[infoIndex];
            const version = versionIndex !== undefined ?
                            data?.bgg_info?.[infoIndex]?.versions?.[versionIndex]
                                                       : undefined;

            return [
                { id: info?.id, name: info?.name },
                version ? { id: version?.version_id, name: version?.name } : undefined,
            ];
        });

        swappableGames.forEach((code, index) => {
            const savedData = saved[code];

            items.push({
                collectionId: code,
                swapItemId: savedData?.swapItemId,
                name: readyGamesData[index]?.[1]?.name ?? savedData?.name ?? '',
                bodyText: makeDescription(savedData?.bodyText ?? '', readyGamesData[index]),
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
    }, [isAdding, swappableGames, gameDataMap, saved, gameSelections]);

    const pendingCount = codes.length - readyGames.length;

    return <div className="flex flex-col items-center gap-2 w-full">
        <button
            className={`btn rounded-full
                bg-[#e07ca4] text-white
                flex items-center justify-center gap-2
                uppercase text-lg font-sharetech
                pl-6 pr-6 pt-2 pb-2
                ${swappableGames.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer' +
                                                                     ' hover:bg-[#d06b93]'}`}
            disabled={swappableGames.length === 0 || isAdding}
            onClick={handleAddAll}
        >
            {isAdding ? <span className="loading loading-bars loading-sm" /> : <FaFileExport className="w-5 h-5" />}
            Download {swappableGames.length} Game{readyGames.length !== 1 ? 's' : ''} to Swap
        </button>
        {pendingCount > 0 && <div className="text-xs text-gray-500">
            {pendingCount} game{pendingCount !== 1 ? 's' : ''} still loading...
        </div>}
    </div>;
};


import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import React, { SyntheticEvent, useLayoutEffect, useState } from 'react';
import { FaDice, FaPlus } from 'react-icons/fa6';

export type UseExtensionReturn = ReturnType<typeof useExtension>;

export const useExtension = (info?: GameUPCBggInfo, version?: GameUPCBggVersion) => {
    const [syncOn, setSyncOn] = useState<boolean>(false);

    useLayoutEffect(() =>
        setSyncOn(document.body.getAttribute('data-shelfscan-sync') === 'on'), [version]);

    const addToCollection = (e: SyntheticEvent<HTMLButtonElement>) => {
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                type: 'add',
                name: version?.name ?? info?.name,
                gameId: info?.id,
                versionId: version?.version_id,
            },
        });
        document.dispatchEvent(ce);

        const target = e.currentTarget.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const addPlay = (e: SyntheticEvent<HTMLButtonElement>) => {
        const currentDate = new Date();
        const dateString = `${currentDate.getFullYear()}/${(currentDate.getMonth() + 1) % 12}/${currentDate.getDate()}`;
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                type: 'plays',
                name: version?.name ?? info?.name,
                gameId: info?.id,
                versionId: version?.version_id,
                date: dateString,
            },
        });
        document.dispatchEvent(ce);

        const target = e.currentTarget.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const addToCollectionBlock = syncOn && (
        <div key="atcb" className="relative shrink-0 w-19">
            <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 h-8.5 w-19"></div>
            <button
                className={`collection-button cursor-pointer rounded-full
                    relative
                    flex justify-start items-center
                    bg-[#e07ca4] text-white
                    p-2 h-8.5
                    text-sm`}
                onClick={addToCollection}
            >
                <FaPlus className="w-4.5 h-4.5" />
                <div className="p-1.5 font-semibold uppercase">Add</div>
            </button>
        </div>
    );

    const addPlayBlock = syncOn && (
        <div key="apb" className="relative shrink-0 w-29">
            <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 h-8.5 w-29"></div>
            <button
                className={`collection-button cursor-pointer rounded-full
                    relative
                    flex justify-start items-center                            
                    bg-[#e07ca4] text-white
                    p-2 h-8.5
                    text-sm`}
                onClick={addPlay}
            >
                <FaDice className="w-5 h-5" />
                <div className="p-1.5 font-semibold uppercase">Log Play</div>
            </button>
        </div>
    );

    const primaries = [addToCollectionBlock, addPlayBlock];

    const primaryActions = syncOn ? <>
        {primaries}
    </> : null

    const secondaryActions = null;

    return { syncOn, addToCollection, addPlay, primaryActions, secondaryActions };
};

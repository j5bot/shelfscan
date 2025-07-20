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
        <div key="atcb" className="relative w-7.5 md:8.5">
            <div className="rounded-full border-0 border-[#e07ca4ff] absolute top-0 left-0 h-7.5 w-7.5 md:h-8.5 md:w-8.5"></div>
            <button
                className={`collection-button cursor-pointer rounded-full
                                    bg-[#e07ca4dc] border-[#e07ca4ff] text-white p-2
                                    absolute top-0 left-0 h-7.5 w-7.5 md:h-8.5 md:w-8.5
                                    text-xs inline-block`}
                onClick={addToCollection}
            >
                <FaPlus className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
            </button>
        </div>
    );

    const addPlayBlock = syncOn && (
        <div key="apb" className="relative w-7.5 md:w-8.5">
            <div className="rounded-full border-0 border-[#e07ca4ff] absolute top-0 left-0 h-7.5 w-7.5 md:h-8.5 md:w-8.5"></div>
            <button
                className={`collection-button cursor-pointer rounded-full
                                bg-[#e07ca4dc] border-[#e07ca4ff] text-white p-1.5
                                absolute top-0 left-0 h-7.5 w-7.5 md:h-8.5 md:w-8.5
                                text-xs inline-block`}
                onClick={addPlay}
            >
                <FaDice className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        </div>
    );

    const blocks = [addToCollectionBlock, addPlayBlock];

    const renderBlock = syncOn ? <div className="absolute flex gap-0.5 md:gap-1.5 top-[-0.25rem] right-0 h-7.5 md:h-8.5">
        {blocks}
    </div> : null;

    const renderItemClassName = syncOn ? `pr-${blocks.length * 9 + 1}` : '';

    return { syncOn, addToCollection, addPlay, renderBlock, renderItemClassName };
};

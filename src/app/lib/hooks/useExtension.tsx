import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import React, { SyntheticEvent, useLayoutEffect, useState } from 'react';
import { FaChevronDown, FaDice, FaPlus } from 'react-icons/fa6';

export type UseExtensionReturn = ReturnType<typeof useExtension>;

export type Modes = {
    addToCollection: 'own' | 'trade' | 'wishlist';
    addPlay: 'quick' | 'detailed';
};

export const useExtension = (info?: GameUPCBggInfo, version?: GameUPCBggVersion) => {
    const [syncOn, setSyncOn] = useState<boolean>(false);
    const [modes, setModes] = useState<Modes>({ addToCollection: 'own', addPlay: 'quick' });

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

        const target = e.currentTarget.parentElement?.previousElementSibling as HTMLDivElement;
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
        <>
            <div key="atcb" className="relative flex justify-start gap-0.5 shrink-0 w-25">
                <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 h-8.5 w-25"></div>
                <div className="relative collapse w-25 min-h-8.5 rounded-none">
                    <input type="checkbox" />
                    <button className={`collapse-title
                        absolute right-0 top-0
                        collection-button cursor-pointer rounded-r-full
                        flex items-center
                        bg-[#e07ca4bb] text-white
                        p-1.5 h-8.5 w-6.5`}>
                        <FaChevronDown className="w-2.5 h-2.5" />
                    </button>
                    <button
                        className={`collection-button cursor-pointer rounded-l-full
                            absolute top-0 left-0
                            flex justify-start items-center
                            bg-[#e07ca4] text-white
                            p-2 h-8.5 w-18
                            z-40
                            text-sm`}
                        onClick={addToCollection}
                    >
                        <FaPlus className="w-4.5 h-4.5" />
                        <div className="p-1.5 font-semibold uppercase">Add</div>
                    </button>
                    <div className="collapse-content p-0 w-25">
                        Add as Owned
                    </div>
                </div>
            </div>
            <div className="collapse w-7 rounded-none">
            </div>
        </>
    );

    const addPlayBlock = syncOn && (
        <div key="apb" className="relative shrink-0 w-29 h-8.5">
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

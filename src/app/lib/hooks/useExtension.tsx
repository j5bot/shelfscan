import { getSetting, setSetting } from '@/app/lib/database/database';
import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import React, { ReactNode, SyntheticEvent, useEffect, useLayoutEffect, useState } from 'react';
import {
    FaChevronDown,
    FaDice,
    FaHeart,
    FaPlus,
    FaRecycle
} from 'react-icons/fa6';

export type Modes = {
    addToCollection: 'add' | 'trade' | 'wishlist';
    addPlay: 'quick' | 'detailed';
};

export type ModeSetting = {
    label: ReactNode;
    icon: ReactNode;
    width: string;
    form?: ReactNode;
    validator?: (formData: FormData) => boolean;
}
export type ModeSettings = Record<Modes['addToCollection'], ModeSetting>;

const addToCollectionModeSettings: ModeSettings = {
    add: {
        label: 'Add',
        icon: <FaPlus className="w-4 h-4 shrink-0" />,
        width: 'w-20',
    },
    trade: {
        label: 'Trade',
        icon: <FaRecycle className="w-4 h-4 shrink-0" />,
        width: 'w-25',
        form: <form name="trade">
            <input type="text" name="condition" className="input text-sm p-2" placeholder="Trade Condition"/>
        </form>,
        validator: (formData: FormData)=> {
            const formValues = Object.fromEntries(formData ?? []);
            return !!(formValues['condition'] as string | undefined)?.length;
        }
    },
    wishlist: {
        label: 'Wish',
        icon: <FaHeart className="w-3.5 h-4 shrink-0" />,
        width: 'w-21',
    },
};

export const useExtension = (info?: GameUPCBggInfo, version?: GameUPCBggVersion) => {
    const [syncOn, setSyncOn] = useState<boolean>(false);
    const [modes, setModes] = useState<Modes>({ addToCollection: 'add', addPlay: 'quick' });

    const atcMode = addToCollectionModeSettings[modes.addToCollection];

    useEffect(() => {
        (async () => {
            setModes(await getSetting('extensionModes') as Modes ?? modes);
        })();
    }, []);

    useLayoutEffect(() => {
        const newValue = document.body.getAttribute('data-shelfscan-sync') === 'on';
        if (syncOn === newValue) {
            return;
        }
        setSyncOn(newValue);
    }, [info, version]);

    const updateModes = async (
        event: SyntheticEvent<HTMLElement>,
        modes: Modes
    ) => {
        // close mode collapse
        const collapse = document
            .querySelector(`[data-collapse=${
                event.currentTarget
                    .parentElement?.getAttribute('data-collapse-key')
            }]`);
        (collapse?.querySelector('input[type=checkbox]') as HTMLInputElement | undefined)?.click();

        await setSetting('extensionModes', modes);
        setModes(modes);
    }

    const addToCollection = (e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document.forms.namedItem(modes.addToCollection);
        const formData = form ? new FormData(form) : undefined;
        if (atcMode.validator && formData && !atcMode.validator(formData)) {
            // TODO: handle invalid cases
            return;
        }

        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                type: modes.addToCollection,
                name: version?.name ?? info?.name,
                gameId: info?.id,
                versionId: version?.version_id,
                formValues: Object.fromEntries(formData ?? []),
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
            <div key="atcb" data-collapse="atcb" className={`relative shrink-0 ${atcMode.width} mr-0.5`}>
                <div className={`rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 h-7 ${atcMode.width}`}></div>
                <div className={`relative collapse min-h-7 rounded-none overflow-visible ${atcMode.width}`}>
                    <input type="checkbox" />
                    <button className={`collapse-title
                        absolute right-0 top-0
                        collection-button cursor-pointer rounded-r-full
                        flex items-center
                        bg-[#e07ca4bb] text-white
                        p-1 h-7 w-4.5`}>
                        <FaChevronDown className="w-2 h-2" />
                    </button>
                    <button
                        className={`collection-button cursor-pointer rounded-l-full
                            absolute top-0 left-0 right-5
                            flex justify-center items-center
                            bg-[#e07ca4] text-white
                            p-1 pl-1.5 h-7
                            z-40
                            text-sm`}
                        onClick={addToCollection}
                    >
                        {atcMode.icon}
                        <div className="p-0.5 font-semibold uppercase">
                            {atcMode.label}
                        </div>
                    </button>
                    <div className={`collapse-content p-0 min-w-29`}>
                        <div className={`mt-1
                            border-1 border-[#e07ca4] rounded-md
                            text-xs leading-5.5`}>
                            <ul className="menu w-full p-0 m-0" data-collapse-key="atcb">
                                <li onClick={e => updateModes(e, Object.assign({}, modes, { addToCollection: 'add' }))}
                                    className="p-1 pl-1.5 border-b-1 border-[#e07ca433]"
                                >Add as Owned</li>
                                <li onClick={e => updateModes(e, Object.assign({}, modes, { addToCollection: 'trade' }))}
                                    className="p-1 pl-1.5 border-b-1 border-[#e07ca433]"
                                >Add for Trade</li>
                                <li onClick={e => updateModes(e, Object.assign({}, modes, { addToCollection: 'wishlist' }))}
                                    className="p-1 pl-1.5"
                                >Add to Wishlist</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {atcMode.form}
        </>
    );

    const addPlayBlock = syncOn && (
        <div key="apb" className="relative shrink-0 w-27 h-7">
            <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 h-7 w-27"></div>
            <button
                className={`collection-button cursor-pointer rounded-full
                    relative
                    flex justify-start items-center                            
                    bg-[#e07ca4] text-white
                    p-1 h-7
                    text-sm`}
                onClick={addPlay}
            >
                <FaDice className="w-4 h-4" />
                <div className="p-1 font-semibold uppercase">Log Play</div>
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

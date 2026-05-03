'use client';

import { useExtension } from '@/app/lib/extension/useExtension';
import { usePlugins } from '@/app/lib/PluginMapProvider';
import { type BggCollectionItem } from '@/app/lib/types/bgg';
import { collectionItemToGame } from '@/app/lib/utils/gameAdapters';
import { DynamicIcon } from '@/app/ui/DynamicIcon';
import { CollectionGameDetails } from '@/app/ui/games/CollectionGameDetails';
import { template } from '@blakeembrey/template';
import { type GameUPCBggInfo } from 'gameupc-hooks/types';
import Link from 'next/link';
import React, { SyntheticEvent, useEffect } from 'react';
import { FaXmark } from 'react-icons/fa6';

const MODAL_THUMBNAIL_SIZE = 400;

const actionTemplateOnClick = (e: SyntheticEvent<HTMLButtonElement>) => {
    const target = e.currentTarget.parentElement?.previousElementSibling as HTMLDivElement;
    void target.offsetWidth;
    target.classList.add('add-pulse');
    setTimeout(() => target.classList.remove('add-pulse'), 2500);
};

type CollectionItemModalContentProps = {
    item: BggCollectionItem;
};

const CollectionItemModalContent = ({ item }: CollectionItemModalContentProps) => {
    const game = collectionItemToGame(item);
    const fakeInfo = { id: item.objectId, name: item.name } as GameUPCBggInfo;
    const { primaryActions, secondaryActions, settings } = useExtension(fakeInfo, undefined);
    const actionTemplates = usePlugins('link.actions');

    const pluginActions = actionTemplates?.game?.map((actionPlugin, index) => {
        const { className, icon, template: pluginTemplate, title } = actionPlugin;
        const templateFn = template(pluginTemplate);
        return (
            <div key={index} className={`relative shrink-0 xs:h-7 h-8 ${className ?? ''} mr-0.5`}>
                <div className={`rounded-full ${className ?? ''} border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8`} />
                <Link title={title} href={templateFn(game)} target="_blank">
                    <button
                        className={`collection-button cursor-pointer rounded-full
                            relative w-full
                            flex justify-start items-center
                            bg-[#e07ca4] text-white
                            p-1 xs:pl-1.5 pl-2 pr-1.5 xs:h-7 h-8
                            xs:font-stretch-semi-condensed xs:tracking-tight
                            text-sm`}
                        onClick={actionTemplateOnClick}
                    >
                        <DynamicIcon icon={icon} size={20} className="w-4 h-4" />
                        <div className="p-0.5 font-semibold uppercase">{title}</div>
                    </button>
                </Link>
            </div>
        );
    });

    const hasActions = primaryActions || (pluginActions && pluginActions.length > 0) || settings;

    return (
        <CollectionGameDetails item={item} thumbnailSize={MODAL_THUMBNAIL_SIZE}>
            {hasActions && (
                <div className="flex flex-wrap justify-start gap-1.5 pt-2">
                    {primaryActions}
                    {pluginActions}
                    {settings}
                </div>
            )}
            {secondaryActions && (
                <div className="flex justify-center pt-2">{secondaryActions}</div>
            )}
        </CollectionGameDetails>
    );
};

type CollectionItemModalProps = {
    item: BggCollectionItem | null;
    onClose: () => void;
};

export const CollectionItemModal = ({ item, onClose }: CollectionItemModalProps) => {
    useEffect(() => {
        if (!item) { return; }
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [item, onClose]);

    if (!item) { return null; }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end xs:items-start sm:items-center
                xs:min-h-[100dvh]
                overflow-y-auto   
                justify-center bg-black/60`}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-label={item.name}
        >
            <div
                className={`
                    relative bg-overlay
                    w-full xs:w-auto sm:w-auto sm:min-w-96 sm:max-w-lg
                    rounded-t-2xl xs:rounded-none sm:rounded-2xl
                    p-4 pt-8
                    xs:min-h-[100dvh]
                `}
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <FaXmark />
                </button>
                <CollectionItemModalContent item={item} />
            </div>
        </div>
    );
};


import { SelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { GameUPCBggInfo, GameUPCBggVersion, GameUPCStatus } from '@/app/lib/types/GameUPCData';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import Image from 'next/image';
import React, { ReactNode } from 'react';
import { FaCheck, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

const getConfidenceLevelColor = (confidence: number) => {
    switch (true) {
        case confidence >= 90:
            return 'lightgreen';
        case confidence >= 60:
            return 'lightblue';
        case confidence >= 45:
            return 'gold';
        case confidence >= 30:
            return 'orange';
        default:
            return 'crimson';
    }
};

export const renderItem = (context: SelectVersionContext, info: GameUPCBggInfo, index: number): ReactNode => {
    const { confidence, name, thumbnail_url } = info;
    const { isInfoInCollection } = context;

    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    return <div className="relative w-[100px] flex justify-center items-center">
        <Image className="object-contain" style={{
                height: '100px',
                width: '100px',
            }} src={thumbnail_url} alt={name} width={100} height={100} />
        <div className="absolute top-0 left-0 bottom-0 right-0 flex gap-1 justify-center items-center">
            {isInfoInCollection(index) && (
                <div className="bg-[#000000aa] h-8 w-8 rounded-full">
                    <FaCheck size={24} className={`text-white mt-1 ml-1`} title="In Collection" />
                </div>
            )}
            <div className="bg-[#000000aa] h-8 w-8 rounded-full">
                <SvgCssGauge className={`w-6 h-6 confidence-level shrink-0 m-1`}
                             color={confidenceLevelColor}
                             fill={confidenceLevelColor}
                             value={confidence} />
            </div>
        </div>
    </div>;
};

export const renderVersionItem = (context: SelectVersionContext, item: GameUPCBggVersion, index: number): ReactNode => {
    const { confidence, name, language, published, thumbnail_url } = item;
    const { isVersionInCollection } = context;

    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    return <div className="relative w-[210px] h-[80px] flex justify-center items-center">
        <Image className="object-contain" style={{
            height: '75px',
            width: '75px',
        }} src={thumbnail_url} alt={name} width={75} height={75} />
        <div className="absolute top-0 left-0 bottom-0 right-[135px]">
            <div className="flex gap-1 justify-center items-center w-full h-full">
                {isVersionInCollection(index) && (
                    <div className="bg-[#000000aa] h-8 w-8 rounded-full">
                        <FaCheck size={24} className={`text-white mt-1 ml-1`} title="In Collection" />
                    </div>
                )}
                <div className="bg-[#000000aa] h-8 w-8 rounded-full">
                    <SvgCssGauge className={`w-6 h-6 confidence-level shrink-0 m-1`}
                                 color={confidenceLevelColor}
                                 fill={confidenceLevelColor}
                                 value={confidence} />
                </div>
            </div>
        </div>
        <div className="flex flex-col border-l-1 border-base-300 w-[135px] pl-1.5 pr-1">
            <div className="text-xs">{name}</div>
            <div className="text-accent text-xs pt-1.5">{language} {published}</div>
        </div>
    </div>;
};

export const renderSelectedItem = (
    context: SelectVersionContext,
    item: GameUPCBggInfo | GameUPCBggVersion
) => {
    if (!item) {
        return;
    }

    const {
        currentInfoInCollection,
        currentVersionInCollection,
        currentVersionIndex,
        info,
        isRemoving,
        removeGameUPC,
        isUpdating,
        updateGameUPC,
        status,
    } = context;

    const { confidence } = item;
    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    const isInfo = (item as GameUPCBggInfo)?.id >= 0;
    const inCollection = isInfo ?
                         currentInfoInCollection :
                         currentVersionInCollection;
    const showUpdate = (isInfo && currentVersionIndex === -1 ) || (!isInfo && currentVersionIndex !== -1);
    const showRemove = isInfo ? status === GameUPCStatus.verified : info?.version_status === GameUPCStatus.verified;

    const selectedItemClasses = `flex gap-1 items-center relative`;

    return <div className="flex gap-1 items-center justify-between text-sm">
        <div className="flex items-center gap-3">
            {item?.name}{
            inCollection &&
            <FaCheck className="tooltip inline-block" data-tooltip="In Collection" />
        }
        </div>
        <div className={selectedItemClasses} data-confidence={item?.confidence}>
            <SvgCssGauge
                className="confidence-level m-0.5"
                duration={0.5}
                fill={confidenceLevelColor}
                color={confidenceLevelColor}
                value={confidence}
            />
            {showUpdate && (
                <button
                    disabled={isUpdating}
                    onClick={updateGameUPC}
                    className="update-button rounded-lg bg-[#e07ca4] text-white h-8 w-8 md:w-fit p-1 md:pl-2 md:pr-2 btn flex text-xs"
                >
                    {isUpdating ?
                        <span className="loading loading-bars loading-xs" /> :
                        <FaThumbsUp  className="md:w-4 md:h-4" />
                    }
                    <span className="hidden md:block">Update</span>
                </button>
            )} {showRemove && (
                <button
                    disabled={isRemoving}
                    onClick={removeGameUPC}
                    className="remove-button rounded-lg h-8 w-8 bg-gray-400 text-white md:w-fit p-1 md:pl-2 md:pr-2 btn flex text-xs"
                >
                    {isRemoving ?
                        <span className="loading loading-bars loading-xs" /> :
                        <FaThumbsDown  className="md:w-4 md:h-4" />
                    }
                    <span className="hidden md:block">Remove</span>
                </button>
            )}
        </div>
    </div>;
};

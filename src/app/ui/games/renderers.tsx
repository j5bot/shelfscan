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

    return <div className="relative w-fit flex justify-center items-center">
        <Image className="w-fit h-fit" src={thumbnail_url} alt={name} width={150} height={150} />
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

    // return <div className="flex items-center justify-start gap-2">
    //     <div>{name}{
    //         isInfoInCollection(index) && <FaCheck />
    //     }</div>
    //     <SvgCssGauge className="confidence-level shrink-0 m-0.5"
    //                  color={confidenceLevelColor}
    //                  fill={confidenceLevelColor}
    //                  value={confidence} />
    // </div>;
};

export const renderVersionItem = (context: SelectVersionContext, item: GameUPCBggVersion, index: number): ReactNode => {
    const { confidence, name, language, published } = item;
    const { isVersionInCollection } = context;

    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    return <div className="flex flex-col items-start">
        <div className="flex gap-2 items-center">
            <div className="flex gap-2">{name}{
                isVersionInCollection(index) && <FaCheck />
            }</div>
            <SvgCssGauge className="confidence-level shrink-0 m-0.5"
                         color={confidenceLevelColor}
                         fill={confidenceLevelColor}
                         value={confidence} />
        </div>
        <div className="text-accent">{language} {published}</div>
    </div>
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
                <>
                    <button
                        disabled={isUpdating}
                        onClick={updateGameUPC}
                        className="update-button text-gray-500 h-6 w-6 md:w-fit p-1 btn flex text-xs"
                    >
                        <FaThumbsUp  className="md:w-2.5 md:h-2.5" />
                        <span className="hidden md:block">Update</span>
                    </button>
                </>
            )} {showRemove && (
                <button
                    disabled={isRemoving}
                    onClick={removeGameUPC}
                    className="remove-button text-gray-500 h-6 w-6 md:w-fit p-1 btn flex text-xs"
                >
                    <FaThumbsDown className="md:w-2.5 md:h-2.5" />
                    <span className="hidden md:block">Remove</span>
                </button>
            )}
        </div>
    </div>;
};

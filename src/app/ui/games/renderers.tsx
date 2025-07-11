import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { GameUPCBggInfo, GameUPCBggVersion, GameUPCStatus } from '@/app/lib/types/GameUPCData';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import React, { ReactNode } from 'react';
import { FaCheck, FaPlus, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

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

export const ItemRenderer = (info: GameUPCBggInfo, index: number): ReactNode => {
    const { confidence, name } = info;
    const { isInfoInCollection } = useSelectVersionContext();

    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    return <div className="flex items-center justify-start gap-2">
        <div>{name}{
            isInfoInCollection(index) && <FaCheck />
        }</div>
        <SvgCssGauge className="confidence-level shrink-0 m-0.5"
                     color={confidenceLevelColor}
                     fill={confidenceLevelColor}
                     value={confidence} />
    </div>;
};

export const VersionItemRenderer = (item: GameUPCBggVersion, index: number): ReactNode => {
    const { confidence, name, language, published } = item;
    const { isVersionInCollection } = useSelectVersionContext();

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

export const SelectedItemRenderer = (item: GameUPCBggInfo | GameUPCBggVersion) => {
    const {
        currentInfoInCollection,
        currentVersionInCollection,
        currentVersionIndex,
        addToCollection,
        info,
        isRemoving,
        removeGameUPC,
        isUpdating,
        updateGameUPC,
        status,
        syncOn,
    } = useSelectVersionContext();

    if (!item) {
        return;
    }
    const { confidence } = item;
    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    const isInfo = (item as GameUPCBggInfo)?.id >= 0;
    const inCollection = isInfo ?
                         currentInfoInCollection :
                         currentVersionInCollection;
    const showUpdate = (isInfo && currentVersionIndex === -1 ) || (!isInfo && currentVersionIndex !== -1);
    const showRemove = isInfo ? status === GameUPCStatus.verified : info?.version_status === GameUPCStatus.verified;

    const selectedItemClasses = `flex gap-1 items-center relative ${syncOn && showUpdate ? 'pr-10' : ''}`;

    return <div className="flex gap-1 items-center justify-between">
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
            {showUpdate && syncOn && <>
                <div className="rounded-full border-0 border-[#e07ca4ff] absolute top-[-0.25rem] right-0 w-8 h-8"></div>
                <button
                    className={`collection-button cursor-pointer rounded-full
                            bg-[#e07ca4dc] border-[#e07ca4ff] text-white
                            absolute top-[-0.25rem] right-0 h-8 w-8 p-2.5
                            flex text-xs`}
                    onClick={addToCollection}
                >
                    <FaPlus className="rounded-full md:w-3.5 md:h-3.5" />
                </button>
            </>}
        </div>
    </div>;
};

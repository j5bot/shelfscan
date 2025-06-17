import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import { CollapsibleList, CollapsibleListProps } from '@/app/ui/CollapsibleList';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import Image from 'next/image';
import React, { ReactNode, useEffect, useState } from 'react';
import { FaX } from 'react-icons/fa6';

export type DetailsDialogProps = {
    closeIcon?: ReactNode;
    id: string;
    infos: GameUPCBggInfo[];
    statusIcon?: ReactNode;
};

const renderVersionItem = (version: GameUPCBggVersion) => {
    return <div className="flex flex-col items-start">
        <div>{version.name}</div>
        <div className="text-accent">{version.language} {version.published}</div>
    </div>
};

export const DetailsDialog = (props: DetailsDialogProps) => {
    const {
        closeIcon = <FaX />,
        id,
        infos,
        statusIcon = null,
    } = props;

    const [currentInfo, setCurrentInfo] = useState<number | null>(infos.length === 1 ? 0 : null);
    const [currentVersion, setCurrentVersion] = useState<number | null>(infos[currentInfo ?? 0]?.versions.length === 1 ? 0 : null);
    const [hoverVersion, setHoverVersion] = useState<number | null>(null);

    useEffect(() => {
        if (infos.length === 1) {
            setCurrentInfo(0);
            return;
        }
        setCurrentInfo(null);
        setCurrentVersion(null);
        setHoverVersion(null);
    }, [id, infos.length, setCurrentInfo]);

    useEffect(() => {
        if (currentInfo === null) {
            return;
        }
        if (infos[currentInfo].versions.length === 1) {
            setCurrentVersion(0);
            return;
        }
        setCurrentVersion(null);
        setHoverVersion(null);
    }, [id, currentInfo, infos[currentInfo ?? 0].versions.length, setCurrentVersion])

    const infoClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-info-index') ?? null;

        if (index === null) {
            return;
        }

        setCurrentInfo(parseInt(index, 10));
    }) as CollapsibleListProps<unknown>['onSelect'];

    const gameClickHandler = () => undefined;

    const versionClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        setCurrentVersion(parseInt(index, 10));
    }) as CollapsibleListProps<unknown>['onSelect'];

    const versionNameClickHandler = () => undefined;

    const versionHoverHandler = ((e: React.MouseEvent) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        if (e.type === 'mouseleave') {
            setHoverVersion(null);
            return;
        }

        setHoverVersion(parseInt(index, 10));
    }) as CollapsibleListProps<unknown>['onHover'];

    const versions = infos[currentInfo ?? 0].versions;

    return <dialog id={id} className="modal">
        <div className="modal-box p-8 max-w-8/12 w-auto">
            <div className="absolute top-1 left-1 tooltip" data-tip="">{statusIcon}</div>
            <div className="absolute top-1 right-2 cursor-pointer">
                <form method="dialog"><button>{closeIcon}</button></form>
            </div>
            <div className="flex flex-col items-center">
                <div>
                    <h3 className="mb-1 text-center">{infos[currentInfo ?? -1]?.name}</h3>
                    <ThumbnailBox
                        alt={versions[hoverVersion ?? currentVersion ?? -1]?.name}
                        url={versions[hoverVersion ?? currentVersion ?? -1]?.thumbnail_url}
                        size={150}
                    />
                    <h3 className="mb-1 text-center">{versions[hoverVersion ?? -1]?.name}</h3>
                </div>
                <div>
                    <div className="flex gap-1 items-center">
                        <div className="tooltip shrink-0" data-tip="Game"><Image
                            className="inline-block"
                            src={'/icons/box-game.png'} alt="Game" width={32} height={32}
                        /></div>
                        <CollapsibleList
                            type="info"
                            items={infos}
                            selectedItemIndex={currentInfo}
                            onClick={gameClickHandler}
                            onSelect={infoClickHandler}
                            getItemKey={(info: GameUPCBggInfo) => info.id.toString()}
                            renderItem={(info: GameUPCBggInfo) => <>{info.name}</>}
                            renderSelectedItem={(info: GameUPCBggInfo) => <>{info.name}</>}
                        />
                    </div>
                    {currentInfo !== null && versions && <div className="flex items-center gap-1.5">
                        <div className="tooltip shrink-0" data-tip="Version"><Image
                            className="inline-block"
                            src={'/icons/box-version.png'}
                            alt="Version" width={32} height={32}
                        /></div>
                        <CollapsibleList
                            type="version"
                            items={versions}
                            selectedItemIndex={currentVersion}
                            onClick={versionNameClickHandler}
                            onHover={versionHoverHandler}
                            onSelect={versionClickHandler}
                            getItemKey={(version: GameUPCBggVersion) => version.version_id.toString()}
                            renderItem={renderVersionItem}
                            renderSelectedItem={(version: GameUPCBggVersion) => <>{version.name}</>}
                        />
                    </div>}
                </div>
            </div>
        </div>
    </dialog>;
};

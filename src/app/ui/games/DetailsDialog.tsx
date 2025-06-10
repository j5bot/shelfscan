import { GameUPCBggInfo } from '@/app/lib/types/GameUPCData';
import Image from 'next/image';
import React, { ReactNode, useEffect, useState } from 'react';
import { FaX } from 'react-icons/fa6';

export type DetailsDialogProps = {
    closeIcon?: ReactNode;
    id: string;
    infos: GameUPCBggInfo[];
    name: string;
    statusIcon?: ReactNode;
};

export const DetailsDialog = (props: DetailsDialogProps) => {
    const {
        closeIcon = <FaX />,
        id,
        infos,
        name,
        statusIcon = null,
    } = props;

    const [infosClosed, setInfosClosed] = useState<boolean>(true);
    const [versionsClosed, setVersionsClosed] = useState<boolean>(true);
    const [currentInfo, setCurrentInfo] = useState<number | null>(infos.length === 1 ? 0 : null);
    const [currentVersion, setCurrentVersion] = useState<number | null>(infos[currentInfo ?? 0]?.versions.length === 1 ? 0 : null);

    useEffect(() => {
        if (infos.length === 1) {
            setCurrentInfo(0);
            setInfosClosed(true);
            return;
        }
        setInfosClosed(false);
        setCurrentInfo(null);
    }, [id, infos.length, setCurrentInfo]);

    useEffect(() => {
        if (currentInfo === null) {
            setInfosClosed(false);
            return;
        }
        if (infos[currentInfo].versions.length === 1) {
            setCurrentVersion(0);
            setVersionsClosed(true);
            return;
        }
        setVersionsClosed(false);
        setCurrentVersion(null);
    }, [id, currentInfo, infos[currentInfo ?? 0].versions.length])

    const infoClickHandler = (e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-info-index');

        if (!index) {
            return;
        }

        setCurrentInfo(parseInt(index, 10));
        setInfosClosed(true);
    };

    const gameClickHandler = () => {
        setInfosClosed(false);
    };

    const versionClickHandler = (e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-version-index');

        if (!index) {
            return;
        }

        setCurrentVersion(parseInt(index, 10));
        setVersionsClosed(true);
    };

    const versionNameClickHandler = () => {
        setVersionsClosed(false);
    };

    const versions = infos[currentInfo ?? 0].versions;

    return <dialog id={id} className="modal">
        <div className="modal-box p-8">
            <div className="absolute top-1 left-1 tooltip" data-tip="">{statusIcon}</div>
            <div className="absolute top-1 right-2 cursor-pointer">
                <form method="dialog"><button>{closeIcon}</button></form>
            </div>
            {/*<h3 className="mb-1">{name} Details</h3>*/}
            <div className="flex gap-1 items-center">
                <div className="tooltip" data-tip="Game"><Image
                    className="inline-block"
                    src={'/icons/box-game.png'} alt="Game" width={32} height={32}
                /></div>
                {infosClosed ?
                 <div
                     className={`rounded-sm bg-orange-200 p-2 ${(currentInfo ?? -1) >= 0 && infos.length > 1 ? 'cursor-pointer' : ''}`}
                     onClick={gameClickHandler}
                 >
                     {infos[currentInfo ?? 0].name}
                 </div> :
                 <div>
                     <h4>Select Game</h4>
                     <ul className="menu bg-base-100 rounded-box p-0.5 w-64 lg:w-fit lg:min-w-64 shadow-sm">
                         {infos.map((info, index) => {
                             return <li
                                 key={info.id}
                                 className={
                                     `cursor-pointer rounded-sm ${
                                         index === currentInfo ?
                                         'p-1 pl-1.5 bg-orange-200' :
                                         'pl-1.5'
                                     }`
                                 }
                                 data-info-index={index}
                                 onClick={infoClickHandler}
                             >
                                 {info.name}
                             </li>;
                         })}
                     </ul>
                 </div>
                }
            </div>
            {versions && <div className="flex items-center gap-1">
                <div className="tooltip" data-tip="Version"><Image
                    className="inline-block"
                    src={'/icons/box-version.png'}
                    alt="Version" width={32} height={32}
                /></div>
                {versionsClosed ?
                 <div
                     className={`rounded-sm bg-orange-200 mt-0.5 p-2 ${(currentVersion ?? -1) >= 0 && versions.length > 1 ? 'cursor-pointer' : ''}`}
                     onClick={versionNameClickHandler}
                 >
                     {versions[currentVersion ?? 0].name}
                 </div> :
                 infosClosed && <div>
                     <h4>Select Version</h4>
                     <ul className="menu pl-0 ml-0 bg-base-100 rounded-box z-1 mb-1 mt-1 lg:w-fit shadow-sm">
                         {versions.map((version, index) => {
                             return <li
                                 key={version.version_id}
                                 className={
                                     `cursor-pointer rounded-sm ${
                                         index === currentVersion ?
                                         'p-1 pl-1.5 bg-orange-200' :
                                         'pl-1.5'
                                     }`
                                 }
                                 data-version-index={index}
                                 onClick={versionClickHandler}
                             >
                                 {version.name}
                             </li>;
                         })}
                     </ul>
                 </div>
                }
            </div>}
        </div>
    </dialog>;
};

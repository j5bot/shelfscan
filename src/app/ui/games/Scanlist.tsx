import {
    GameUPCData,
    GameUPCVersionStatus,
    GameUPCVersionStatusText
} from '@/app/lib/types/GameUPCData';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { DetailsDialog } from '@/app/ui/games/DetailsDialog';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import Link from 'next/link';
import { ReactNode } from 'react';
import { FaCheckCircle, FaQuestionCircle, FaSearch, FaSearchPlus } from 'react-icons/fa';
import { FaBarcode, FaX } from 'react-icons/fa6';

type ScanlistProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
}

export function Scanlist(props: ScanlistProps) {
    const { codes, gameUPCResults } = props;

    return (<ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg-grid-cols-6">{codes.map(code => {
        const {
            bgg_info: bggInfo,
            bgg_info_status: bggInfoStatus,
        } = gameUPCResults[code] ?? {};

        const statusText = GameUPCVersionStatusText[bggInfoStatus];

        if (!bggInfo) {
            return;
        }

        const {
            name = 'Nothing Found', /* versions = [], */
            thumbnail_url: thumbnailUrl,
        } = bggInfo?.[0] ?? {};

        const imageSize = getImageSizeFromUrl(thumbnailUrl ?? '');
        const smallSquareSize = Math.min(imageSize.width, imageSize.height) * 2 / 3;
        const imageContainerStyles = {
            width: `${smallSquareSize}px`,
            height: `${smallSquareSize}px`,
        };

        let statusIcon: ReactNode;
        let overlayIcon: ReactNode;

        const statusIconClassName = 'w-3 h-3 md:w-5 md:h-5';
        const overlayIconSize = (smallSquareSize ?? 100) * 0.5;

        switch (bggInfoStatus) {
            case GameUPCVersionStatus.verified:
                statusIcon = <FaCheckCircle className={statusIconClassName} title="VerifiGameUPCVersionStatused" />;
                break;
            case GameUPCVersionStatus.none:
                statusIcon = <FaQuestionCircle className={statusIconClassName} title="Unknown" />;
                overlayIcon = <FaSearchPlus title="Must Search" color="white" size={overlayIconSize} />
                break;
            case GameUPCVersionStatus.choose_from_versions:
                statusIcon = <FaSearch className={statusIconClassName} title="Choose From Versions" />;
                overlayIcon = <FaSearch title="Must Search" color="white" size={overlayIconSize} />
                break;
            case GameUPCVersionStatus.choose_from_bgg_info_or_search:
                statusIcon = <FaSearchPlus className={statusIconClassName} title="Choose or Search" />;
                overlayIcon = <FaSearchPlus title="Must Search" color="white" size={overlayIconSize} />
                break;
            case GameUPCVersionStatus.choose_from_versions_or_search:
                statusIcon = <FaSearchPlus className={statusIconClassName} title="Choose or Search" />;
                overlayIcon = <FaSearchPlus title="Must Search" color="white" size={overlayIconSize} />
                break;
            default:
                statusIcon = <FaQuestionCircle className={statusIconClassName} title="Unknown" />;
                break;
        }

        void overlayIcon;

        const detailDialogId = `version_dialog_${code}`;

        return <li className="relative rounded-md bg-orange-100" key={code}>
            <DetailsDialog
                id={detailDialogId}
                infos={bggInfo}
                closeIcon={<FaX className="w-4 h-4 p-0.5" />}
                statusIcon={statusIcon}
            />
            {/*<button*/}
            {/*    className="absolute bottom-0 right-0.5 md:bottom-1 md:right-1 tooltip"*/}
            {/*    data-tip={statusText}*/}
            {/*    data-for-dialog={detailDialogId}*/}
            {/*    onClick={e => (document.getElementById(*/}
            {/*        e.currentTarget.getAttribute('data-for-dialog') as string*/}
            {/*    ) as HTMLDialogElement).showModal()}*/}
            {/*>*/}
            {/*    {statusIcon}*/}
            {/*</button>*/}
            <Link
                href={`/upc/${code}`}
                className="absolute bottom-0 right-0.5 md:bottom-1 md:right-1 tooltip"
                data-tip={statusText}
            >
                {statusIcon}
            </Link>
            <div className="flex flex-col p-3 md:p-4">
                <div className="flex justify-center items-center gap-1 tooltip" data-tip={name}>
                    <FaBarcode title={code} />
                    <div
                        className="w-fit overflow-ellipsis overflow-hidden text-nowrap"
                        title={name}
                    >
                        {name}
                    </div>
                </div>
                <ThumbnailBox
                    alt={name}
                    url={thumbnailUrl}
                    size={smallSquareSize}
                    styles={imageContainerStyles}
                />
            </div>
        </li>;
    })}</ul>);

    /*
     <details className="dropdown dropdown-hover">
     <summary>{info.name}</summary>
     <div className="lg:left-10/12 top-0 lg:dropdown-content border-none">
     <ul className="menu pl-0 ml-0 bg-base-100 rounded-box z-1 mb-1 mt-1 lg:w-fit shadow-sm">
     {info.versions.map(version => {
     return <li key={version.version_id} className="">
     {version.name}
     </li>
     })}
     </ul>
     </div>
     </details>
     */
}

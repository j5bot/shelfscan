import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import {
    GameUPCData,
    GameUPCVersionStatus,
    GameUPCVersionStatusText
} from '@/app/lib/types/GameUPCData';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import Link from 'next/link';
import { ReactNode } from 'react';
import { FaCheckCircle, FaQuestionCircle, FaSearch, FaSearchPlus } from 'react-icons/fa';
import { FaBarcode } from 'react-icons/fa6';

type ScanlistProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
}

export function Scanlist(props: ScanlistProps) {
    const { codes, gameUPCResults } = props;
    const { gameSelections } = useGameSelections();

    return (<ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg-grid-cols-6">{codes.map(code => {
        const {
            bgg_info: bggInfo,
            bgg_info_status: bggInfoStatus,
        } = gameUPCResults[code] ?? {};

        const [infoId, versionId] = gameSelections[code] ?? [];

        const infoIndex = bggInfo?.
            findIndex(info => info.id === infoId);
        const versionIndex = bggInfo?.[infoIndex]?.versions.
            findIndex(version => version.version_id === versionId);

        const statusText = GameUPCVersionStatusText[bggInfoStatus];

        if (!bggInfo) {
            return;
        }

        const {
            name = 'Nothing Found', /* versions = [], */
        } = bggInfo?.[infoIndex] ?? bggInfo?.[0] ?? {};

        const {
            name: versionName,
            thumbnail_url: thumbnailUrl,
        } = bggInfo?.[infoIndex]?.versions?.[versionIndex] ?? bggInfo?.[0] ?? {};

        const combinedName = name + (versionName ? ` (${versionName})` : '');

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

        return <li className="relative rounded-md bg-orange-100" key={code}>
            <Link
                href={`/upc/${code}`}
                className="absolute bottom-0 right-0.5 md:bottom-1 md:right-1 tooltip"
                data-tip={statusText}
            >
                {statusIcon}
            </Link>
            <div className="flex flex-col pt-1 p-3 md:p-4 md:pt-2">
                <div className="flex justify-center items-center gap-1 tooltip" data-tip={combinedName}>
                    <FaBarcode title={code} size={15} className="shrink-0"/>
                    <div
                        className="w-fit overflow-ellipsis overflow-hidden text-nowrap"
                        title={combinedName}
                    >
                        {combinedName}
                    </div>
                </div>
                <Link href={`/upc/${code}`}>
                    <ThumbnailBox
                        alt={combinedName}
                        url={thumbnailUrl}
                        size={smallSquareSize}
                        styles={imageContainerStyles}
                    />
                </Link>
            </div>
        </li>;
    })}</ul>);
}

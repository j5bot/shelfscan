import { GameSelections, useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { SelectVersionProvider, useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import {
    GameUPCData, GameUPCStatus,
    GameUPCVersionStatusText
} from '@/app/lib/types/GameUPCData';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { getConfidenceLevelColor } from '@/app/ui/games/renderers';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import Link from 'next/link';
import { ReactNode } from 'react';
import { FaQuestionCircle, FaSearch, FaSearchPlus } from 'react-icons/fa';
import { FaBarcode, FaCheck, FaEye, FaHeart, FaRecycle } from 'react-icons/fa6';

type ScanItemProps = {
    code: string;
    gameUPCResults: Record<string, GameUPCData>;
    gameSelections: GameSelections;
}

type ScanlistProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
}

export const ScanItem = (props: ScanItemProps) => {
    const { code, gameSelections, gameUPCResults } = props;
    const { currentInfoIndex, infoIndexesInCollection } = useSelectVersionContext();

    const {
        bgg_info: bggInfo,
        bgg_info_status: bggInfoStatus,
    } = gameUPCResults[code] ?? {};

    const [infoId, versionId] = gameSelections[code] ?? [];

    let infoIndex = bggInfo?.
        findIndex(info => info.id === infoId);
    let versionIndex = bggInfo?.[infoIndex]?.versions.
        findIndex(version => version.version_id === versionId);

    infoIndex = infoIndex > -1 ? infoIndex : currentInfoIndex ?? 0;
    versionIndex = versionIndex > -1 ? versionIndex : 0;

    const statusText = GameUPCVersionStatusText[bggInfoStatus];

    if (!bggInfo) {
        return;
    }

    const {
        name = 'Nothing Found',
        confidence = 0,
    } = bggInfo?.[infoIndex] ?? {};

    const {
        name: versionName,
        thumbnail_url: thumbnailUrl,
    } = bggInfo?.[infoIndex]?.versions?.[versionIndex] ?? bggInfo?.[infoIndex] ?? {};

    const combinedName = name + (versionName ? ` (${versionName})` : '');

    const imageSize = getImageSizeFromUrl(thumbnailUrl ?? '');
    const smallSquareSize = Math.min(imageSize.width, imageSize.height) * 2 / 3;
    const imageContainerStyles = {
        width: `${smallSquareSize}px`,
        height: `${smallSquareSize}px`,
    };

    let statusIcon: ReactNode;

    const statusIconClassName = 'w-3 h-3 md:w-5 md:h-5';
    const confidenceLevelColor = getConfidenceLevelColor(confidence);

    switch (bggInfoStatus) {
        case GameUPCStatus.verified:
            statusIcon = <SvgCssGauge className={`w-3.5 h-3.5 md:w-5 md:h-5 confidence-level`}
                                      color={confidenceLevelColor}
                                      fill={confidenceLevelColor}
                                      value={confidence} />;
            break;
        case GameUPCStatus.none:
            statusIcon = <FaQuestionCircle className={statusIconClassName} title="Unknown" />;
            break;
        case GameUPCStatus.choose_from_versions:
            statusIcon = <FaSearch className={statusIconClassName} title="Choose From Versions" />;
            break;
        case GameUPCStatus.choose_from_bgg_info_or_search:
            statusIcon = <FaSearchPlus className={statusIconClassName} title="Choose or Search" />;
            break;
        case GameUPCStatus.choose_from_versions_or_search:
            statusIcon = <FaSearchPlus className={statusIconClassName} title="Choose or Search" />;
            break;
        default:
            statusIcon = <FaQuestionCircle className={statusIconClassName} title="Unknown" />;
            break;
    }

    let cornerIcon: ReactNode = <FaBarcode title={code} size={15} className="shrink-0" />;
    switch (true) {
        case infoIndexesInCollection.own.includes(infoIndex ?? 0):
            cornerIcon = <FaCheck title={code} className="shrink-0" />;
            break;
        case infoIndexesInCollection.fortrade.includes(infoIndex ?? 0):
            cornerIcon = <FaRecycle title={code} className="shrink-0" />;
            break;
        case infoIndexesInCollection.wishlist.includes(infoIndex ?? 0):
            cornerIcon = <FaHeart title={code} className="shrink-0" />;
            break;
        case infoIndexesInCollection.all.includes(infoIndex ?? 0):
            cornerIcon = <FaEye title={code} size={15} className="shrink-0" />;
            break;
        default:
            break;
    }

    return <li className="relative rounded-md bg-orange-100 dark:bg-orange-900" key={code}>
        <Link
            href={`/upc/${code}`}
            className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 tooltip"
            data-tip={statusText}
        >
            {statusIcon}
        </Link>
        <div className="flex flex-col pt-1 p-3 md:p-4 md:pt-2">
            <div className="flex justify-center items-center gap-1.5 tooltip" data-tip={combinedName}>
                {cornerIcon}
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
};

export const Scanlist = (props: ScanlistProps) => {
    const { codes, gameUPCResults } = props;
    const { gameSelections } = useGameSelections();

    return <ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg-grid-cols-6">
        {codes.map(code => (
            <SelectVersionProvider key={code} id={code}>
                <ScanItem code={code}
                          gameUPCResults={gameUPCResults}
                          gameSelections={gameSelections}
                />
            </SelectVersionProvider>
        ))}
    </ul>;
}

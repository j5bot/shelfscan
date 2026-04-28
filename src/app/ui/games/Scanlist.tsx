import { useCodes } from '@/app/lib/CodesProvider';
import { GameSelections, useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useImageMismatch } from '@/app/lib/hooks/useImageMismatch';
import { SelectVersionProvider, useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { GameListContainer } from '@/app/ui/games/GameListContainer';
import { ListGame } from '@/app/ui/games/ListGame';
import {
    GameUPCData, GameUPCStatus,
    GameUPCVersionStatusText
} from 'gameupc-hooks/types';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { getConfidenceLevelColor } from '@/app/ui/games/renderers';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import { ReactNode, Suspense, use } from 'react';
import { FaQuestionCircle, FaSearch, FaSearchPlus } from 'react-icons/fa';
import {
    FaBarcode,
    FaCheck,
    FaEye,
    FaHeart,
    FaRecycle,
} from 'react-icons/fa6';
import { IoTrashBin } from 'react-icons/io5';

type ScanItemProps = {
    code: string;
    removeFromList: (code: string) => void;
    gameUPCResults: Record<string, GameUPCData>;
    gameSelections: GameSelections;
}

type ScanlistProps = {
    gameUPCResults: Record<string, GameUPCData>;
}

export const ScanItem = (props: ScanItemProps) => {
    const { code, gameSelections, gameUPCResults, removeFromList } = props;
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

    const {
        name: infoName = 'Nothing Found',
        confidence = 0,
    } = bggInfo?.[infoIndex] ?? {};

    const {
        name: versionName,
        thumbnail_url: thumbnailUrl,
        image_url: sourceImageUrl,
    } = bggInfo?.[infoIndex]?.versions?.[versionIndex] ?? bggInfo?.[infoIndex] ?? {};

    const imageUrlPromise = useImageMismatch(
        bggInfo?.[infoIndex]?.id, bggInfo?.[infoIndex]?.versions?.[versionIndex]?.version_id
    );
    const imageUrl = imageUrlPromise ? use(imageUrlPromise) : undefined;

    if (!bggInfo) {
        return;
    }

    const name = infoName + (versionName ? ` (${versionName})` : '');

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
        case infoIndexesInCollection.fortrade?.includes(infoIndex ?? 0):
            cornerIcon = <FaRecycle title={code} className="shrink-0" />;
            break;
        case infoIndexesInCollection.own?.includes(infoIndex ?? 0):
            cornerIcon = <FaCheck title={code} className="shrink-0" />;
            break;
        case infoIndexesInCollection.wishlist?.includes(infoIndex ?? 0):
            cornerIcon = <FaHeart title={code} className="shrink-0" />;
            break;
        case infoIndexesInCollection.all?.includes(infoIndex ?? 0):
            cornerIcon = <FaEye title={code} size={15} className="shrink-0" />;
            break;
        default:
            break;
    }

    const keyValue = code;
    const detailUrl = `/upc/${code}`;
    const bottomLeftIcon = <button
        className="remove-scan-item absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1"
        title="Remove from List"
        onClick={() => removeFromList(code)}
        >
            <IoTrashBin size={15} className="shrink-0 cursor-pointer" />
        </button>;

    const listGameProperties = {
        bottomLeftIcon,
        cornerIcon,
        detailUrl,
        imageContainerStyles,
        imageUrl,
        keyValue,
        name,
        smallSquareSize,
        statusIcon,
        statusText,
        thumbnailUrl,
    };

    return <ListGame {...listGameProperties } />;
};

export const Scanlist = (props: ScanlistProps) => {
    const { gameUPCResults } = props;
    const { codes, setCodes } = useCodes();
    const { gameSelections } = useGameSelections();

    const removeFromList = (code: string) => {
        setCodes(codes.filter(c => c !== code));
    };

    return <GameListContainer>
        {codes.map(code => (
            <SelectVersionProvider key={code} id={code}>
                <Suspense fallback={<ListGame keyValue={code} name={''} smallSquareSize={100} statusIcon={undefined} statusText={''} thumbnailUrl={''} />}>
                    <ScanItem code={code}
                              gameUPCResults={gameUPCResults}
                              gameSelections={gameSelections}
                              removeFromList={removeFromList}
                    />
                </Suspense>
            </SelectVersionProvider>
        ))}
    </GameListContainer>;
};

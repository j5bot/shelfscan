import { GameSelections, useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useImageMismatch } from '@/app/lib/hooks/useImageMismatch';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { SelectVersionProvider, useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { gameUPCInfoAndVersionToCollectionItem } from '@/app/lib/utils/gameAdapters';
import { GameListContainer } from '@/app/ui/games/GameListContainer';
import { ListGame } from '@/app/ui/games/ListGame';
import { GridClasses, ThumbnailSizes } from '@/app/ui/grids/gridSizes';
import { type GameUPCBggInfo, type GameUPCBggVersion, type GameUPCData } from 'gameupc-hooks/types';
import { GameUPCStatus, GameUPCVersionStatusText } from 'gameupc-hooks/useGameUPC';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { getConfidenceLevelColor } from '@/app/ui/games/renderers';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import { Suspense, use } from 'react';
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
    showGame?: boolean;
    removeFromList: (code: string) => void;
    gameUPCResults: Record<string, GameUPCData>;
    gameSelections: GameSelections;
};

type ScanlistProps = {
    codes: string[];
    removeCode: (code: string) => void;
    showGame?: boolean;
};

type BggInfos = NonNullable<GameUPCData['bgg_info']>;
type InfoIndexesInCollection = ReturnType<typeof useSelectVersionContext>['infoIndexesInCollection'];

const statusIconClassName = 'w-3 h-3 md:w-5 md:h-5';

type ScanInfo = Partial<GameUPCBggInfo>;
type ScanVersion = Partial<GameUPCBggVersion> | ScanInfo;

/** The game-level (showGame) or version-level name and images for a scan. */
const getScanDisplay = (info: ScanInfo, version: ScanVersion, showGame?: boolean) => {
    const infoName = info.name ?? 'Nothing Found';
    return showGame
        ? { name: infoName, thumbnailUrl: info.thumbnail_url, imageUrl: info.image_url }
        : {
            name: version.name ? `${infoName} (${version.name})` : infoName,
            thumbnailUrl: version.thumbnail_url,
            imageUrl: version.image_url,
        };
};

/** The stored selection for this code, falling back to the provider's current info and the first version. */
const resolveScanIndexes = (
    bggInfo: BggInfos | undefined,
    [infoId, versionId]: number[],
    currentInfoIndex: number | null,
) => {
    const selectedInfoIndex = bggInfo?.findIndex(info => info.id === infoId) ?? -1;
    // the stored version only counts when its info is the stored (found) one
    const selectedVersionIndex = bggInfo?.[selectedInfoIndex]?.versions
        .findIndex(version => version.version_id === versionId) ?? -1;
    const infoIndex = selectedInfoIndex > -1 ? selectedInfoIndex : currentInfoIndex ?? 0;
    return { infoIndex, versionIndex: selectedVersionIndex > -1 ? selectedVersionIndex : 0 };
};

const ScanStatusIcon = ({ status, confidence }: { status: GameUPCData['bgg_info_status']; confidence: number }) => {
    const confidenceLevelColor = getConfidenceLevelColor(confidence);
    switch (status) {
        case GameUPCStatus.verified:
            return <SvgCssGauge className={`w-3.5 h-3.5 md:w-5 md:h-5 confidence-level`}
                                color={confidenceLevelColor}
                                fill={confidenceLevelColor}
                                value={confidence} />;
        case GameUPCStatus.choose_from_versions:
            return <FaSearch className={statusIconClassName} title="Choose From Versions" />;
        case GameUPCStatus.choose_from_bgg_info_or_search:
        case GameUPCStatus.choose_from_versions_or_search:
            return <FaSearchPlus className={statusIconClassName} title="Choose or Search" />;
        default:
            return <FaQuestionCircle className={statusIconClassName} title="Unknown" />;
    }
};

type ScanCornerIconProps = {
    code: string;
    infoIndex: number;
    infoIndexesInCollection: InfoIndexesInCollection;
};

/** Collection status of the selected game: for trade, owned, wishlist, seen, or just scanned. */
const ScanCornerIcon = ({ code, infoIndex, infoIndexesInCollection }: ScanCornerIconProps) => {
    switch (true) {
        case infoIndexesInCollection.fortrade?.includes(infoIndex):
            return <FaRecycle title={code} className="shrink-0" />;
        case infoIndexesInCollection.own?.includes(infoIndex):
            return <FaCheck title={code} className="shrink-0" />;
        case infoIndexesInCollection.wishlist?.includes(infoIndex):
            return <FaHeart title={code} className="shrink-0" />;
        case infoIndexesInCollection.all?.includes(infoIndex):
            return <FaEye title={code} size={15} className="shrink-0" />;
        default:
            return <FaBarcode title={code} size={15} className="shrink-0" />;
    }
};

export const ScanItem = (props: ScanItemProps) => {
    const { code, gameSelections, gameUPCResults, removeFromList, showGame } = props;
    const { currentInfoIndex, infoIndexesInCollection } = useSelectVersionContext();

    const { isBatchTrade } = useTradeMode();

    const {
        bgg_info: bggInfo,
        bgg_info_status: bggInfoStatus,
    } = gameUPCResults[code] ?? {};

    const { infoIndex, versionIndex } = resolveScanIndexes(bggInfo, gameSelections[code] ?? [], currentInfoIndex);

    const info: ScanInfo = bggInfo?.[infoIndex] ?? {};
    const version: ScanVersion = bggInfo?.[infoIndex]?.versions?.[versionIndex] ?? bggInfo?.[infoIndex] ?? {};
    const display = getScanDisplay(info, version, showGame);

    const imageUrlPromise = useImageMismatch(
        !info.image_url?.includes('_original'),
        !version.image_url?.includes('_original'),
        bggInfo?.[infoIndex]?.id,
        showGame ? undefined : bggInfo?.[infoIndex]?.versions?.[versionIndex]?.version_id,
    );

    if (!bggInfo) {
        return;
    }

    const imageUrl = imageUrlPromise instanceof Promise ? use(imageUrlPromise) : display.imageUrl;
    const imageSize = getImageSizeFromUrl(imageUrl ?? '');
    const thumbnailSize = isBatchTrade ? ThumbnailSizes.large : Math.min(imageSize.width, imageSize.height) * 2 / 3;

    return <ListGame
        code={code}
        item={gameUPCInfoAndVersionToCollectionItem(info as GameUPCBggInfo, version as GameUPCBggVersion)}
        bottomLeftIcon={<button
            className="remove-scan-item absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1"
            title="Remove from List"
            onClick={() => removeFromList(code)}
        >
            <IoTrashBin size={15} className="shrink-0 cursor-pointer" />
        </button>}
        cornerIcon={<ScanCornerIcon code={code} infoIndex={infoIndex} infoIndexesInCollection={infoIndexesInCollection} />}
        detailUrl={`/upc/${code}`}
        imageContainerStyles={{ width: `${thumbnailSize}px`, height: `${thumbnailSize}px` }}
        imageUrl={imageUrl}
        keyValue={code}
        name={display.name}
        thumbnailSize={thumbnailSize}
        statusIcon={<ScanStatusIcon status={bggInfoStatus} confidence={info.confidence ?? 0} />}
        statusText={GameUPCVersionStatusText[bggInfoStatus]}
        thumbnailUrl={display.thumbnailUrl ?? ''}
        size={isBatchTrade ? 'large' : 'small'}
    />;
};

export const Scanlist = ({
    codes,
    removeCode,
    showGame,
}: ScanlistProps) => {
    const { gameDataMap } = useGameUPCData();
    const { gameSelections } = useGameSelections();
    const { isBatchTrade } = useTradeMode();

    return <GameListContainer
        className={isBatchTrade ? GridClasses.large : undefined}
    >
        {codes.map(code => (
            <SelectVersionProvider key={code} id={code}>
                <Suspense fallback={<ListGame keyValue={code} name={''} thumbnailSize={100} statusIcon={undefined} statusText={''} thumbnailUrl={''} />}>
                    <ScanItem code={code}
                              gameUPCResults={gameDataMap}
                              gameSelections={gameSelections}
                              removeFromList={removeCode}
                              showGame={showGame}
                    />
                </Suspense>
            </SelectVersionProvider>
        ))}
    </GameListContainer>;
};

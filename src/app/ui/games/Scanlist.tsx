import { GameUPCData, GameUPCVersionStatus } from '@/app/lib/types/GameUPCData';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import Image from 'next/image';
import { ReactNode } from 'react';
import { FaCheckCircle, FaQuestionCircle, FaSearch, FaSearchPlus } from 'react-icons/fa';
import { FaBarcode, FaQuestion } from 'react-icons/fa6';

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

        return <li className="relative rounded-md bg-orange-100" key={code}>
            <div className="absolute bottom-1 right-1">{statusIcon}</div>
            <div className="flex flex-col p-2 md:p-4">
                <div className="flex justify-center items-center gap-1">
                    <FaBarcode title={code} />
                    <p className="w-fit overflow-ellipsis overflow-hidden text-nowrap">{name}</p>
                </div>
                {thumbnailUrl ? (
                    <div className="flex justify-center p-1">
                        <div className={`
                            relative
                            bg-orange-50
                            flex justify-center items-center
                            rounded-md overflow-clip
                            focus:overflow-visible focus:scale-150 focus:border-orange-400 focus:border
                            hover:overflow-visible hover:scale-150 hover:border-orange-400 hover:border`}
                            style={imageContainerStyles}>
                            {/*<div className={`absolute top-1 left-1 opacity-65`}>{overlayIcon}</div>*/}
                            <Image
                                src={thumbnailUrl}
                                alt={name}
                                width={smallSquareSize}
                                height={smallSquareSize}
                            />
                        </div>
                    </div>
                ) : (
                    <FaQuestion className="self-center m-2 fill-orange-500" title="No Image" size={64} />
                )}
            </div>
        </li>;

    })}</ul>);

}

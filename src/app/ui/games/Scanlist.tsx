import { GameUPCData } from '@/app/lib/types/GameUPCData';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import Image from 'next/image';
import { FaBarcode } from 'react-icons/fa6';

type ScanlistProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
}

export function Scanlist(props: ScanlistProps) {
    const { codes, gameUPCResults } = props;

    return (<ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg-grid-cols-6">{codes.map(code => {
        const { bgg_info: bggInfo } = gameUPCResults[code] ?? {};

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

        return <li className="rounded-md bg-orange-100" key={code}>
            <div className="flex flex-col p-2 md:p-4">
                <div className="flex justify-center items-center gap-1">
                    <FaBarcode title={code} />
                    <p className="w-fit overflow-ellipsis overflow-hidden text-nowrap">{name}</p>
                </div>
                {thumbnailUrl && (
                    <div className="flex justify-center p-1">
                        <div className="bg-orange-50 flex justify-center items-center rounded-md overflow-clip hover:overflow-visible hover:scale-150 hover:border-orange-400 hover:border" style={imageContainerStyles}>
                            <Image
                                src={thumbnailUrl}
                                alt={name}
                                width={smallSquareSize}
                                height={smallSquareSize}
                            />
                        </div>
                    </div>
                )}
            </div>
        </li>;

    })}</ul>);

}

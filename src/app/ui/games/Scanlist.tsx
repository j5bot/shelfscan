import { GameUPCData } from '@/app/lib/types/GameUPCData';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import Image from 'next/image';

type ScanlistProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
}

export function Scanlist(props: ScanlistProps) {
    const { codes, gameUPCResults } = props;

    return (<ul className="flex items-start gap-3 flex-wrap">{codes.map(code => {
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

        return <li className="flex flex-col rounded-md bg-orange-100 p-4" key={code}>
            <p>{name}</p>
            <p className="text-sm text-gray-400">[{code}]</p>
            {thumbnailUrl && (
                <div className="flex justify-center p-1">
                    <div className="flex justify-center items-center overflow-clip hover:overflow-visible hover:scale-150" style={imageContainerStyles}>
                        <Image
                            className=""
                            src={thumbnailUrl}
                            alt={name}
                            width={smallSquareSize}
                            height={smallSquareSize}
                        />
                    </div>
                </div>
            )}
        </li>;

    })}</ul>);

}

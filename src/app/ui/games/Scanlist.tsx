import { GameUPCData } from '@/app/lib/types/GameUPCData';
import Image from 'next/image';

type ScanlistProps = {
    codes: string[];
    gameUPCResults: Record<string, GameUPCData>;
}

export function Scanlist(props: ScanlistProps) {
    const { codes, gameUPCResults } = props;

    return (<ul className="flex items-center gap-3">{codes.map(code => {
        const { bgg_info: bggInfo } = gameUPCResults[code];

        const {
            name = 'Nothing Found', /* versions = [], */
            thumbnail_url: thumbnailUrl,
        } = bggInfo?.[0] ?? {};

        return <li className="rounded-md bg-orange-100 p-4" key={code}>
            <p>{name}</p>
            <p className="text-sm text-gray-400">[{code}]</p>
            <p><Image src={thumbnailUrl} alt={name} /></p>
        </li>;

    })}</ul>);

}

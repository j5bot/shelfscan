import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import Link from 'next/link';
import { CSSProperties, ReactNode } from 'react';

export type ListGameProps = {
    bottomLeftIcon?: ReactNode;
    cornerIcon?: ReactNode;
    detailUrl?: string;
    detailUrlTarget?: string;
    detailUrlRel?: string;
    imageContainerStyles?: CSSProperties;
    keyValue: string;
    name: string;
    smallSquareSize: number;
    statusIcon: ReactNode;
    statusText: string;
    thumbnailUrl: string;
}

export const ListGame = (props: ListGameProps) => {
    const {
        bottomLeftIcon,
        cornerIcon,
        detailUrl,
        detailUrlTarget,
        detailUrlRel,
        imageContainerStyles,
        keyValue,
        name,
        smallSquareSize,
        statusIcon,
        statusText,
        thumbnailUrl,
    } = props;

    const thumbnail = <ThumbnailBox
        alt={name}
        url={thumbnailUrl}
        size={smallSquareSize}
        styles={imageContainerStyles}
    />;

    return <li className="list-none relative rounded-md bg-white dark:bg-gray-900" key={keyValue}>
        {bottomLeftIcon}
        {detailUrl ? <Link
            href={detailUrl}
            className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1"
            title={statusText}
            target={detailUrlTarget}
            rel={detailUrlRel}
        >
            {statusIcon}
        </Link> : <span title={statusText}>statusIcon</span>}
        <div className="flex flex-col pt-1 p-3 md:p-4 md:pt-2">
            <div className="flex justify-center items-center gap-1.5">
                {cornerIcon}
                <div
                    className="w-fit overflow-ellipsis overflow-hidden text-nowrap"
                    title={name}
                >
                    {name}
                </div>
            </div>
            {detailUrl ? <Link href={detailUrl} target={detailUrlTarget} rel={detailUrlRel}>
                {thumbnail}
            </Link> : thumbnail}
        </div>
    </li>;
};

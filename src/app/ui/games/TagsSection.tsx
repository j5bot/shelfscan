import { useSelector } from '@/app/lib/hooks';
import { EMPTY_TAGS, selectTagsByCollectionId } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import React from 'react';

export type TagsSectionProps = {
    collectionId: number;
    className?: string;
};

export const TagsSection = ({
    collectionId,
    className
}: TagsSectionProps) => {
    const tags = useSelector((state: RootState) =>
        selectTagsByCollectionId([state])[collectionId] ?? EMPTY_TAGS,
    ).map(tag => (
        <span
            key={tag}
            className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-base-300 text-base-content/70 whitespace-nowrap"
        >
            {tag}
        </span>
    ));

    return <div className={`flex flex-wrap gap-1 ${className}`}>{
        tags
    }</div>;
};

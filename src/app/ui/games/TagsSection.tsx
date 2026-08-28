import { useSelector } from '@/app/lib/hooks';
import { EMPTY_TAGS, selectTagsByCollectionId } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import React from 'react';

export const TagsSection = ({ collectionId }: { collectionId: number }) => {
    const tags = useSelector((state: RootState) =>
        selectTagsByCollectionId([state])[collectionId] ?? EMPTY_TAGS,
    ).map(tag => (
        <span
            key={tag}
            className="text-[10px] leading-tight px-1 rounded bg-base-200 text-base-content/60 whitespace-nowrap"
        >
            {tag}
        </span>
    ));

    return <div className="mt-2 border-t border-base-content/15 pt-2 flex flex-wrap">{
        tags
    }</div>;
};

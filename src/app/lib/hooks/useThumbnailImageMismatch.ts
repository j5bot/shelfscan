import { BggInfo } from '@/app/lib/types/types';
import { useMemo } from 'react';

export type ThumbnailImageMismatchEntry = {
    id: number;
    versionIds: number[];
};

export const useThumbnailImageMismatch = (infos: BggInfo[]): ThumbnailImageMismatchEntry[] =>
    useMemo(() =>
        infos.reduce((queue: ThumbnailImageMismatchEntry[], info) => {
            const problemVersionIds = info.versions
                .filter(version => version.image_url === version.thumbnail_url)
                .map(version => version.version_id);

            if (info.image_url === info.thumbnail_url || problemVersionIds.length > 0) {
                queue.push({ id: info.id, versionIds: problemVersionIds });
            }

            return queue;
        }, []),
    [infos]);

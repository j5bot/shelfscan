import { clearImageCache, getImageCacheUsage } from '@/app/lib/database/cacheDatabase';
import React, { useEffect, useState } from 'react';
import { FaSync } from 'react-icons/fa';

export const ImageCacheManager = () => {
    const [usage, setUsage] = useState<string>();
    const [refreshCount, setRefreshCount] = useState<number>(0);

    useEffect(() => {
        (async () => {
            setUsage(await getImageCacheUsage());
        })();
    }, [refreshCount]);

    return <div className="collapse collapse-arrow bg-base-100 border-1 border-base-300 text-sm">
        <input type="radio" name="settings" />
        <h3 className="collapse-title font-semibold">Image Cache</h3>
        <div className="collapse-content text-xs">
            <div className="p-1 flex flex-col gap-2">
                <p className="text-balance">
                    ShelfScan uses a local image cache to avoid re-downloading images from
                    BoardGameGeek.  Please do not clear this cache frequently.
                </p>
                <p>Current estimated cache usage:</p>
                <p>
                    {usage} <button className="ml-1" onClick={() => {
                        setRefreshCount(refreshCount + 1);
                    }}><FaSync className="cursor-pointer"/></button>
                </p>
            </div>
            <p className="mt-2">
                <button className="btn btn-warning" onClick={async () => {
                    await clearImageCache();
                    setRefreshCount(refreshCount + 1);
                }}>
                    Clear Image Cache
                </button>
            </p>
        </div>
    </div>;
};

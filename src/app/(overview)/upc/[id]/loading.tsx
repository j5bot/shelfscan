import { loader } from '@/app/(overview)/loading';
import React from 'react';

export const Loading = () => {
    return (
        <div
            className="absolute top-0 w-screen h-screen right-0 bottom-0 left-0 flex justify-center items-center">
            {loader('Searching shelves...')}
        </div>
    );
};

export default Loading;

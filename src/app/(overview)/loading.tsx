import React, { ReactNode } from 'react';

export const loader = (loadingText: ReactNode) => {
    return <div className="w-1/2 h-30 bg-overlay flex flex-col justify-center items-center">
        <div className="loading loading-bars loading-xl" />
        <div>{loadingText}</div>
    </div>;
};

export const Loading = () => {
    return (
        <div
            className="absolute top-0 w-screen h-screen right-0 bottom-0 left-0 flex justify-center items-center">
            {loader('Warming up...')}
        </div>
    );
};

export default Loading;

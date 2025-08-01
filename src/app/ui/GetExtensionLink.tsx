import Link from 'next/link';
import React from 'react';
import { FaFirefox, FaSafari } from 'react-icons/fa6';

export const GetExtensionLink = () => {
    return <div className="flex justify-center pb-4">
        <Link id="get-extension-link" className={`btn max-w-2/3 rounded-full
                bg-[#e07ca4] text-white
                flex items-center justify-center gap-1
                uppercase text-md font-sharetech`}
              href="/extension">
            <FaFirefox className="w-4 h-4" />
            <FaSafari className="w-4 h-4" />
            Get the Extension
        </Link></div>;
};

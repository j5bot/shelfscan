import { GearIcon } from '@/app/ui/icons/GearIcon';
import { OrionIcon } from '@/app/ui/icons/OrionIcon';
import Link from 'next/link';
import React from 'react';
import { FaChrome, FaFirefox } from 'react-icons/fa6';

export const GetExtensionLink = () => {
    return <div className="flex justify-center pb-4">
        <Link id="get-extension-link" className={`btn max-w-2/3 rounded-full
                bg-brand-background text-white
                flex items-center justify-center gap-1
                uppercase text-md font-sharetech`}
              href="/extension" suppressHydrationWarning>
            <FaFirefox className="w-4 h-4" />
            <GearIcon className="w-4 h-4" />
            <OrionIcon className="w-4 h-4" fill="#e07ca4" />
            <FaChrome className="w-4 h-4" />
            Get the Extension
        </Link></div>;
};

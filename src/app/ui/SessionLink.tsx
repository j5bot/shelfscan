import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';

export type SessionLinkProps = {
    compressedCodes: string[];
};

export const SessionLink = (props: SessionLinkProps) => {
    const { compressedCodes } = props;
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sessionParams = new URLSearchParams(searchParams);
    sessionParams.set('u', compressedCodes.join('.'));
    const sessionLink = `${pathname}?${sessionParams.toString()}`;

    return compressedCodes.length > 0 && <div className={`pr-3 text-right text-xs font-sharetech
                                                            underline self-stretch`}>
        <Link href={sessionLink}>session link</Link>
    </div>
};

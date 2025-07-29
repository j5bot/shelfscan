import Link from 'next/link';
import React from 'react';

export type SessionLinkProps = {
    compressedCodes: string[];
};

export const SessionLink = (props: SessionLinkProps) => {
    const { compressedCodes } = props;

    const sessionLink = new URL(window?.location.href);
    sessionLink.searchParams.set('u', compressedCodes.join(''));

    return compressedCodes.length > 0 && <div className={`pr-3 text-right text-xs font-sharetech
                                                            underline self-stretch`}>
        <Link href={sessionLink.toString()}>session link</Link>
    </div>
};

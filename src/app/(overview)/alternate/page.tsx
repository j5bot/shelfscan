'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const AlternateSupporterPage = () => {
    useTitle('ShelfScan | Alternate Supporter');

    const [agreeChecked, setAgreeChecked] = useState<boolean>(false);
    const [isAlternate, setIsAlternate] = useState<boolean>(false);

    useEffect(() => {
        setIsAlternate(window?.localStorage?.getItem('alternate-supporter') === 'supporter');
    }, []);

    const writeAssertSupporter = () => {
        if (!agreeChecked) {
            return;
        }
        window?.localStorage?.setItem('assert-supporter', 'supporter');
        setIsAlternate(true);
    };

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">
                    Alternate Supporter
                </h1>

                <p>I assert that I am a <Link href="https://boardgamegeek.com/support"
                    className="underline"
                    target="_blank"
                    rel="noreferrer noopener"
                >
                    BoardGameGeek Supporter
                </Link> using ShelfScan with an alternate account.</p>
                <p>I understand
                    that circumventing the requirement for BGG supporter
                    status is a violation of the terms of service of both
                    BoardGameGeek and ShelfScan.</p>
                <p><label htmlFor="agree"><input id="agree"
                    type="checkbox" className="checkbox" onChange={event =>
                        setAgreeChecked(event.target.checked)} /> I am a BGG supporter</label>
                </p>
                <p><button className={`btn btn-outline
                    ${isAlternate ? 'opacity-30 pointer-events-none' : ''}
                    bg-accent text-white`}
                           onClick={writeAssertSupporter}
                           aria-disabled={isAlternate}
                           disabled={isAlternate}
                >
                    Agree and Continue
                </button></p>
            </div>
        </div>
    </>;
};

export default AlternateSupporterPage;

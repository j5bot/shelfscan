'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaFirefox,
    FaSafari,
} from 'react-icons/fa6';

const WhySupportPage = () => {
    useTitle('ShelfScan | Why Support BoardGameGeek?');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">
                    Why Support BoardGameGeek?
                </h1>

                <h3 className="font-semibold mb-2">BGG Relies on You, We Rely on BGG</h3>
                <p>
                    The data used by ShelfScan to display your collection and other
                    information is sourced directly from BoardGameGeek.  While BGG
                    is a community-driven site, they people who run it rely on user support and ad
                    revenue to pay to keep it running.
                </p>
                <p>
                    When you choose to use ShelfScan over the native BGG interface,
                    you won't see the ads that keep the bills paid there.  This is the same as if
                    you are a BoardGameGeek supporter at the $25 ad-block level or higher using the
                    BGG site directly.
                </p>
                <p>
                    My ethical decision when building the browser extension that allows BGG
                    updates through ShelfScan was to require that level of
                    support in order to use all its features.
                </p>

                <p>Show your <Link className="underline"
                                   href="https://boardgamegeek.com/support" target="_blank">
                    love and support for BGG
                </Link> and then get the extension!</p>

                <p><Link className="flex items-center gap-2" href="https://addons.mozilla.org/en-US/firefox/addon/shelfscan-io/">
                    <FaFirefox className="w-6 h-6" /> <span className="underline">
                        Download the Extension for Firefox on Android
                    </span>
                </Link></p>
                <p><Link className="flex items-center gap-2" href="https://testflight.apple.com/join/rhZAHudK">
                    <FaSafari className="w-6 h-6" /> <span className="underline">
                        Join the Extension's Safari on iOS beta
                    </span>
                </Link></p>
            </div>
        </div>
    </>;
};

export default WhySupportPage;

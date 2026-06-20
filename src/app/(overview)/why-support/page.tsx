'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaChrome,
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
                   The collection data and other information displayed in ShelfScan are sourced directly from BoardGameGeek. While BGG is a community-driven platform, the team that operates and maintains it depends on user support and advertising revenue to keep the site running.
                </p>
                <p>
                    When you use ShelfScan instead of the native BGG interface, you are no longer viewing the ads that help fund BoardGameGeek. In practice, this is equivalent to using BGG as a Supporter at the $25 ad-free level or higher.
                </p>
                <p>
                    Because of this, I made the ethical decision that the browser extension features allowing updates to BoardGameGeek through ShelfScan should require users to support BGG at that same level.
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

<p><Link className="flex items-center gap-2" href="https://chromewebstore.google.com/detail/shelfscan/eohbphncdiehigcejaeaddegejphnbgd/">
                    <FaChrome className="w-6 h-6" /> <span className="underline">
                        Download for Gear on iOS
                    </span>
                </Link> (<Link href="https://apps.apple.com/app/apple-store/id1458962238" target="_blank" className="underline">Gear browser</Link>)</p>
            </div>
        </div>
    </>;
};

export default WhySupportPage;

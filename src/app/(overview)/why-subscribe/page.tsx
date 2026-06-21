'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaChrome,
    FaFirefox,
} from 'react-icons/fa6';

const WhySubscribePage = () => {
    useTitle('ShelfScan | Why a Subscription?');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">
                    Why a Subscription?
                </h1>

                <h3 className="font-semibold mb-2">It's Simple. Costs.</h3>
                <p>
                    There are both fixed and variable costs to developing and hosting
                    the ShelfScan web app, and to providing an iOS extension on the
                    App Store. I am currently unable to pay these costs out of pocket
                    and I believe that the value you can get out of ShelfScan is much
                    higher than the price of the subscription.
                </p>
                <p>
                    If you can benefit from the ShelfScan application and are a
                    non-profit volunteer, open source contributor, or similar, or can
                    (actively) assist in the testing of ShelfScan, I am happy to discuss
                    providing a free subscription.
                </p>

                <p><Link className="flex items-center gap-2" href="https://addons.mozilla.org/en-US/firefox/addon/shelfscan-io/">
                    <FaFirefox className="w-6 h-6" /> <span className="underline">
                        Download the Extension for Firefox on Android
                    </span>
                </Link></p>

<p><Link className="flex items-center gap-2" href="https://chromewebstore.google.com/detail/shelfscan/eohbphncdiehigcejaeaddegejphnbgd/">
                    <FaChrome className="w-6 h-6" /> <span className="underline">
                        Download for Gear on iOS / Chrome on Desktop
                    </span>
                </Link> (<Link href="https://apps.apple.com/app/apple-store/id1458962238" target="_blank" className="underline">Gear browser</Link>)</p>
            </div>
        </div>
    </>;
};

export default WhySubscribePage;

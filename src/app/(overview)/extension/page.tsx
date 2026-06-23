'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaChrome,
    FaDice,
    FaFirefox,
    FaHeart,
    FaPlus,
    FaRecycle,
    FaTag,
} from 'react-icons/fa6';

const ExtensionPage = () => {
    useTitle('ShelfScan | Extension');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">
                    Browser Extension
                </h1>

                <h3 className="font-semibold">Get the Browser Extension and Do More</h3>
                <p>
                    ShelfScan works together with a browser extension to add
                    lots of extra features that bring together BGG and the web app with a
                    low-cost subscription (<Link href="/why-subscribe/"
                                                 className="underline" target="_blank">why a subscription?</Link>) .
                </p>

                <p><Link className="flex items-center gap-2" href="https://addons.mozilla.org/en-US/firefox/addon/shelfscan-io/"
                         target="_blank"><FaFirefox className="w-6 h-6" /> <span className="underline">
                        Download for Firefox on Android / Desktop
                    </span>
                </Link></p>
                <p className="flex items-center gap-2">
                    <Link href="https://chromewebstore.google.com/detail/shelfscan/eohbphncdiehigcejaeaddegejphnbgd/"
                          target="_blank"><FaChrome className="w-6 h-6" />
                    </Link>
                    <Link className="underline" href="https://chromewebstore.google.com/detail/shelfscan/eohbphncdiehigcejaeaddegejphnbgd/"
                          target="_blank">Download</Link> for
                    <Link href="https://apps.apple.com/app/apple-store/id1458962238" target="_blank" className="underline">Gear on iOS</Link> / <Link
                    href="https://chromewebstore.google.com/detail/shelfscan/eohbphncdiehigcejaeaddegejphnbgd/"
                    target="_blank"
                    className="underline">Chrome on Desktop</Link>
                </p>

                <h4 className="uppercase font-semibold pt-5 pb-3">Free 30 Day Trial!</h4>
                <ul className="font-sharetech text-lg pb-2">
                    <li>[ <FaPlus className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games To Your Collection ]</li>
                    <li>[ <FaRecycle className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games For Trade ]</li>
                    <li>[ <FaHeart className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games To Wishlist ]</li>
                    <li>[ <FaTag className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games to GeekMarket ]</li>
                    <li>[ <FaDice className="h-2.5 w-3 inline-block mr-1" /> Log Plays on BGG ]</li>
                </ul>

                <p>Get more details about ShelfScan workflows on our{' '}
                    <Link href="/workflows/" className="underline">workflows</Link> page.</p>

                <p>Once your free trial is over, being a <Link href="https://boardgamegeek.com/support"
                                                               className="underline"
                                                               target="_blank">
                    BGG Supporter
                </Link> at the "ad block" level is required to use the extension.</p>

                <p><Link href="/why-support/"
                         className="underline" target="_blank">Why support BoardGameGeek?</Link></p>

                <p>Note: As of June 28, 2026, the ShelfScan Browser Extension for Safari is no longer supported.</p>
            </div>
        </div>
    </>;
};

export default ExtensionPage;

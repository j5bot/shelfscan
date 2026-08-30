'use client';

import { useExtPay } from '@/app/lib/hooks/useExtPay';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { GearIcon } from '@/app/ui/icons/GearIcon';
import { OrionIcon } from '@/app/ui/icons/OrionIcon';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaChrome,
    FaCopy,
    FaDice,
    FaFirefox,
    FaHeart,
    FaPlus,
    FaRecycle,
    FaSafari,
    FaTag,
} from 'react-icons/fa6';

const ExtensionPage = () => {
    useTitle('ShelfScan | Extension');
    const {
        copyPromoCode,
        openPaymentPage,
        openTrialPage,
    } = useExtPay();

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

                <p className="text-xl uppercase font-sharetech">
                    1 Year Subscription for $2 with code <button className="btn btn-outline rounded-md inline-flex items-center gap-1"
                                                                  onClick={copyPromoCode}
                                                                  aria-label="Copy promo code 2BUCKS"
                                                                  title="Copy to clipboard">2BUCKS <FaCopy size={12} /></button>
                </p>

                <div className="pt-3">
                    <button className="bg-brand-background rounded-xl text-white btn mr-3"
                            onClick={openTrialPage}>30 Day Free Trial</button>
                    <button className="bg-brand-background rounded-xl text-white btn"
                            onClick={openPaymentPage}>Subscribe to ShelfScan</button>
                </div>

                <p><Link className="flex items-center gap-2" href="https://addons.mozilla.org/en-US/firefox/addon/shelfscan-io/"
                         target="_blank"><FaFirefox className="w-6 h-6" /> <span className="underline">
                        Download for Firefox on Android / Desktop
                    </span>
                </Link></p>
                <p className="flex items-center gap-1"><Link className="flex items-center gap-2" href="https://addons.mozilla.org/en-US/firefox/addon/shelfscan-io/"
                                                             target="_blank"><GearIcon className="w-6 h-6" /> <span className="underline">
                        Download</span>
                </Link> for <Link href="https://apps.apple.com/app/apple-store/id1458962238"
                                  target="_blank"
                                  className="underline"
                >Gear</Link> on iOS
                </p>
                <p className="flex items-center gap-1"><Link className="flex items-center gap-2" href="https://addons.mozilla.org/en-US/firefox/addon/shelfscan-io/"
                                                             target="_blank"><OrionIcon className="w-6 h-6" /> <span className="underline">
                        Download</span>
                </Link> for <Link
                    href="https://orionbrowser.com/download/appstore"
                    target="_blank"
                    className="underline">Orion</Link> on iOS
                </p>
                <p><Link className="flex items-center gap-2"
                         href="https://chromewebstore.google.com/detail/shelfscan/eohbphncdiehigcejaeaddegejphnbgd/"
                         target="_blank"><FaChrome className="w-6 h-6" /> <span className="underline">
                        Download for Chrome on Desktop
                    </span>
                </Link></p>

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

                <p><Link className="flex items-center gap-2" href="https://github.com/j5bot/shelfscan-safari/releases"
                         target="_blank"><FaSafari className="w-6 h-6" /> <span className="underline">
                        Safari Extension for Sideloading (Unsigned)
                    </span>
                </Link></p>
                <p>Note: As of June 28, 2026, the signed ShelfScan Browser Extension for Safari is no longer supported.</p>
            </div>
        </div>
    </>;
};

export default ExtensionPage;

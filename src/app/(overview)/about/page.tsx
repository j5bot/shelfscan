'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaCheck,
    FaDice,
    FaFirefox,
    FaHeart,
    FaPlus,
    FaRecycle,
    FaSafari,
    FaTag,
    FaThumbsUp
} from 'react-icons/fa6';

const AboutPage = () => {
    useTitle('ShelfScan | About');

    return <>
        <NavDrawer />
        <div className="about-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center">
                    About ShelfScan
                </h1>

                <p><Link className="flex items-center justify-center gap-2 uppercase text-lg font-sharetech"
                         href="/extension">
                    <FaFirefox className="w-6 h-6" />
                    <FaSafari className="w-6 h-6" />
                    Get the Extension!
                </Link></p>

                <h2 className="text-lg pt-2">What You Can Do</h2>

                <p>Be sure to visit our <Link className="underline"
                        href="https://boardgamegeek.com/blog/16520/shelfscan-news" target="_blank"
                    >blog@BGG</Link> for detailed info, but you can ...
                </p>

                <h3>[ Scan Games ]</h3>
                <p>
                    Use the barcode scanner to scan game UPCs.
                    Click on the game in the list, and help update the <Link
                    className="underline" href="https://gameupc.com" target="_blank"
                    >GameUPC database</Link> by verifying the game and version you&apos;ve
                    scanned — click that{' '}
                    <FaThumbsUp className="ml-1 mr-1 align-baseline inline-block" /> thumbs up!
                </p>
                <ul className="text-xs">
                    <li><Link className="underline" href="/?u=1f1koq13">Sample verified game</Link></li>
                    <li><Link className="underline" href="/?u=2u35dg26">Sample unverified game</Link></li>
                    <li><Link className="underline" href="/?u=494q2639">Sample unknown game</Link></li>
                </ul>

                <h3>[ Audit Your Collection ]</h3>
                <p>Enter your <Link className="underline"
                                    href="https://boardgamegeek.com" target="_blank"
                    >BoardGameGeek</Link> username and click the &apos;Get Collection&apos; button.</p>
                <p>
                    After you scan a game, click on it in the list and verify that
                    there is a <FaCheck className="inline-block align-middle" /> checkmark.
                </p>
                <p><Link className="text-md underline"
                         href="/?u=auhgeaaf.a6qhsifv.8xpr0k48.19ep3ngxq.1wa2w78td.bcpzlcgs.2ui4plrn9.1bzdy84iq.1c3wzemki.8ejpqxn5.auib8nrk.9azysvve">
                    Sample Audit Session
                </Link></p>

                <h3 className="font-semibold">Get the Browser Extension and Do More!</h3>
                <p>
                    ShelfScan works together with a browser extension to bring you
                    lots of extra features to bring together BGG and the web app with a
                    low-cost subscription.
                </p>
                <ul className="font-sharetech text-md pb-4">
                    <li>[ <FaPlus className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games To Your Collection ]</li>
                    <li>[ <FaRecycle className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games For Trade ]</li>
                    <li>[ <FaHeart className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games To Wishlist ]</li>
                    <li>[ <FaTag className="h-2.5 w-3.5 inline-block mr-0.5" /> Add Games to GeekMarket ]</li>
                    <li>[ <FaDice className="h-2.5 w-3 inline-block mr-1" /> Log Plays on BGG ]</li>
                </ul>

                <h2 className="text-lg">History of ShelfScan</h2>
                <p>
                    ShelfScan began as a project to implement scanning
                    of game barcodes and then interfacing with the <Link
                        className="underline" href="https://gameupc.com" target="_blank"
                    >GameUPC API</Link>.
                </p>
                <p>
                    Having worked with the <Link className="underline"
                        href="https://boardgamegeek.com" target="_blank"
                    >BoardGameGeek</Link> <Link className="underline"
                        href="https://boardgamegeek.com/wiki/page/BGG_XML_API2" target="_blank"
                    >XML API</Link> previously, and looking for good motivations for folks
                    to come and use the scanner, I implemented collection lookup
                    and matching.  Users were now able to use ShelfScan to audit
                    their game libraries.
                </p>
                <p>
                    My hope, though, was to help people add games to their collections.
                    Whether they have just gotten a new game or find that they&apos;ve
                    missed one while taking inventory, how much easier could it get?
                </p>
                <p>
                    Because of some technical limitations and licensing restrictions
                    it is not feasible to directly add games from ShelfScan to BGG.
                    But necessity is the mother of invention.
                </p>
                <p>
                    I developed a browser extension, primarily targeted at mobile
                    users — Safari/iOS and Firefox/Android — that bridges the gap
                    between BGG and ShelfScan.  It opens the door to doing anything
                    you can do on the BoardGameGeek website with the help of the app.
                </p>
                <p>
                    Check out the <Link className="underline"
                        href="https://boardgamegeek.com/blog/16520/shelfscan-news" target="_blank"
                    >blog</Link> and <Link className="underline"
                        href="https://www.facebook.com/groups/1371928150537745" target="_blank"
                    >Facebook group</Link> to stay in the know.
                </p>
            </div>
        </div>
    </>;
};

export default AboutPage;

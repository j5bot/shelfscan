'use client';

import { MathTradeDialog } from '@/app/ui/MathTradeDialog';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MathTradeLandingPage() {
    const router = useRouter();

    const [mtdIsOpen, setMTDIsOpen] = useState<boolean>(false);

    return (
        <>
            <NavDrawer />
            <div className="page-content w-screen pt-15 flex justify-center">
                <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                    <h1 className="text-3xl text-center text-balance">
                        Math Trades
                    </h1>

                    <h3 className="font-semibold">
                        OLWLG Based Trades
                    </h3>
                    <p><button className="btn btn-md bg-purple-800 text-white rounded-md font-semibold"
                               onClick={() => setMTDIsOpen(true)}
                    >Use OLWLG Math Trade</button></p>
                    <p>
                        <Link href="https://bgg.activityclub.org"
                              className="underline"
                              target="_blank">OLWLG</Link> based trades utilize
                        a specially formatted BoardGameGeek geeklist and geeklist items.
                    </p>
                    <p>
                        The OLWLG app can synchronize your BGG collection and
                        assist you with adding 'For Trade' items to the geeklist.
                    </p>
                    <p>
                        With ShelfScan, you can add items to an OLWLG geeklist
                        from any part of your collection.  Using the
                        ShelfScan <Link
                        href="/extension"
                        target="_blank"
                        className="underline"
                    >extension</Link> you can automatically add items
                        without having to submit a form for each.
                    </p>
                    <p>If you find the OLWLG useful, please <Link
                        className="btn btn-sm btn-outline rounded-md"
                        href="https://www.paypal.com/donate/?hosted_button_id=MRVK7G255ZESL"
                        target="_blank"
                    >Donate</Link></p>

                    <h3 className="font-semibold">
                        Swaptagon Based Trades
                    </h3>

                    <p><Link className="btn btn-md bg-purple-800 text-white rounded-md font-semibold"
                             href="/swap"
                    >Use Swaptagon with Collection</Link></p>
                    <p><Link className="btn btn-md bg-purple-800 text-white rounded-md font-semibold"
                             href="/swapscan"
                    >Use Swaptagon with Batch Scan</Link></p>

                    <p>
                        <Link href="https://swaptagon.com"
                              className="underline" target="_blank">Swaptagon</Link>{' '}
                        is a new platform used for Math Trades of any kind of item.
                    </p>
                    <p>
                        ShelfScan integrates with Swaptagon by allowing you to export a file with
                        game condition data, images, etc. for bulk importing into a swap event.
                    </p>
                    <p>
                        A <Link href="https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importSwap.user.js"
                                target="_blank" className="underline">userscript</Link>{' '}
                        will allow you to import the file from the Swaptagon site.
                    </p>

                    <h3 className="font-semibold">
                        Atlas Realms Based Trades
                    </h3>

                    <p><Link className="btn btn-md bg-purple-800 text-white rounded-md font-semibold"
                             href="/trade"
                    >Use Atlas Realms with Collection</Link></p>
                    <p><Link className="btn btn-md bg-purple-800 text-white rounded-md font-semibold"
                             href="/tradescan"
                    >Use Atlas Realms with Batch Scan</Link></p>

                    <p>
                        <Link href="https://www.atlasrealms.com"
                              className="underline" target="_blank">Atlas Realms</Link>{' '}
                        is another platform used for Math Trades, primarily board games.
                    </p>
                    <p>
                        ShelfScan integrates with Atlas Realms by allowing you to export a file with
                        game condition data, etc. for bulk importing into a trade.
                    </p>
                    <p>
                        A <Link href="https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importAtlas.user.js"
                                target="_blank" className="underline">userscript</Link>{' '}
                        will allow you to import the file from the Atlas Realms site.
                    </p>
                </div>
            </div>
            <MathTradeDialog
                isOpen={mtdIsOpen}
                onClose={() => setMTDIsOpen(false)}
                onLoaded={(id) => router.push(`/math-trade/${id}`)}
            />
        </>
    );
}

import { OLWLGTrades } from '@/app/ui/workflows/math-trades/OLWLGTrades';
import Link from 'next/link';
import React from 'react';

export const MathTrades = () => (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
        <input type="radio" name="math-trades" />
        <h2 className="collapse-title text-lg px-3 py-0.5"
            id="math-trades">Math Trades - OLWLG</h2>
        <div className="collapse-content">

            <p>Math Trades are easier with ShelfScan. You can search and filter your
                entire collection or for some platforms, simply scan games.</p>
            <p>Then you'll open new windows, export files from ShelfScan to import
                into other sites, or with the
                <Link className="underline"
                      href="/extension">Extension</Link>, add items with the click of
                a button.
            </p>

            {/*<p>Three separate platforms for Math Trades are supported:</p>*/}
            {/*<ul className="list-disc list-inside">*/}
            {/*    <li>*/}
            {/*        <Link href="https://bgg.activityclub.org/olwlg/"*/}
            {/*              className="underline" target="_blank">OLWLG</Link> - Online*/}
            {/*        Want List Generator, uses BGG Geeklists to manage offered games*/}
            {/*    </li>*/}
            {/*    <li>*/}
            {/*        <Link href="https://swaptagon/"*/}
            {/*              className="underline" target="_blank">*/}
            {/*            Swaptagon*/}
            {/*        </Link> - Swaptagon supports any type of trade item, not just*/}
            {/*        BGG-backed board games*/}
            {/*    </li>*/}
            {/*    <li>*/}
            {/*        <Link href="https://atlasrealms.com/trades/"*/}
            {/*              className="underline" target="_blank">*/}
            {/*            Atlas Realms Trades*/}
            {/*        </Link> - Atlas Realms' trade platform interacts directly with*/}
            {/*        BGG but does not rely on geeklists*/}
            {/*    </li>*/}
            {/*</ul>*/}

            <OLWLGTrades />
        </div>
    </div>
);

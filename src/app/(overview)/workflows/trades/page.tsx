'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { OLWLGTrades } from '@/app/ui/workflows/math-trades/OLWLGTrades';
import Link from 'next/link';
import React from 'react';

const MathTradeWorkflowsPage = () => {
    useTitle('ShelfScan | Math Trade Workflows');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center">
                    ShelfScan Math Trade Workflows
                </h1>

                <div className="flex flex-col gap-1 pt-2">
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="math-trades" />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="math-trades">OLWLG</h2>
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
                </div>
                {/*<div className="p-2">*/}
                {/*    <p>For all workflows, make sure that you have 'signed in' with your*/}
                {/*        BGG username, and that you have recently refreshed your*/}
                {/*        collection data using the 'Refresh Collection' button in the*/}
                {/*        navigation menu.</p>*/}
                {/*    <p>If a workflow requires the <a href="/extension">ShelfScan*/}
                {/*        Extension</a>, make sure that you have it installed in your*/}
                {/*        browser, that you are an active <a href="https://boardgamegeek.com/support">BGG*/}
                {/*            Supporter</a> or Free Trial user. Also make sure that you have*/}
                {/*        logged into BGG with the same user with which you 'signed in' to*/}
                {/*        ShelfScan.</p>*/}

                {/*    <p>For most uses of ShelfScan, we recommend using the same mobile*/}
                {/*        device each time. The larger the screen, the easier it will be to use the*/}
                {/*        application. A small tablet or a phone with a large screen will work*/}
                {/*        well.</p>*/}

                {/*    <p>To use a computer with ShelfScan on iOS, Continuity Camera can be used so*/}
                {/*        that your phone acts as a wireless handheld camera for the application.*/}
                {/*        There are also programs available on Android OS to achieve the same*/}
                {/*        functionality, such as <Link href="https://play.google.com/store/apps/details?id=com.dev47apps.droidcam&hl=en"*/}
                {/*            className="underline"*/}
                {/*            target="_blank">DroidCam</Link>.</p>*/}
                {/*</div>*/}
            </div>
        </div>
    </>;
};

export default MathTradeWorkflowsPage;

'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { GearIcon } from '@/app/ui/icons/GearIcon';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { CollectionAudit } from '@/app/ui/workflows/CollectionAudit';
import { CollectionLoading } from '@/app/ui/workflows/CollectionLoading';
import { CollectionMaintenance } from '@/app/ui/workflows/CollectionMaintenance';
import { CollectionQuickFiltering } from '@/app/ui/workflows/CollectionQuickFiltering';
import Link from 'next/link';
import React from 'react';
import {
    FaChrome,
    FaFirefox,
} from 'react-icons/fa6';

const WorkflowsPage = () => {
    useTitle('ShelfScan | Workflows');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center">
                    ShelfScan Workflows
                </h1>

                <p>
                    <Link className="flex items-center justify-center gap-2 uppercase text-lg font-sharetech"
                          href="/extension">
                        <FaFirefox className="w-6 h-6" />
                        <GearIcon className="w-6 h-6" />
                        <FaChrome className="w-6 h-6" />
                        Get the Extension!
                    </Link></p>

                <div className="flex flex-col gap-1 pt-2">
                    <CollectionLoading />
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="math-trades" />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="math-trades">Math Trades</h2>
                        <div className="collapse-content">
                            <p>
                                <Link className="underline" href="/workflows/trades">All Math Trade Workflows</Link>
                            </p>
                        </div>
                    </div>
                    <CollectionMaintenance />
                    <CollectionAudit />
                    <CollectionQuickFiltering />
                </div>
                <div className="p-2">
                    <p>For all workflows, make sure that you have 'signed in' with your
                        BGG username, and that you have recently refreshed your
                        collection data using the 'Refresh Collection' button in the
                        navigation menu.</p>
                    <p>If a workflow requires the <a href="/extension">ShelfScan
                        Extension</a>, make sure that you have it installed in your
                        browser, that you are an active <a href="https://boardgamegeek.com/support">BGG
                            Supporter</a> or Free Trial user. Also make sure that you have
                        logged into BGG with the same user with which you 'signed in' to
                        ShelfScan.</p>

                    <p>For most uses of ShelfScan, we recommend using the same mobile
                        device each time. The larger the screen, the easier it will be to use the
                        application. A small tablet or a phone with a large screen will work
                        well.</p>

                    <p>To use a computer with ShelfScan on iOS, Continuity Camera can be used so
                        that your phone acts as a wireless handheld camera for the application.
                        There are also programs available on Android OS to achieve the same
                        functionality, such as <Link href="https://play.google.com/store/apps/details?id=com.dev47apps.droidcam&hl=en"
                            className="underline"
                            target="_blank">DroidCam</Link>.</p>
                </div>
            </div>
        </div>
    </>;
};

export default WorkflowsPage;

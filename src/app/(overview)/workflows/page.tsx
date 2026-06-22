'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
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
                        <FaChrome className="w-6 h-6" />
                        Get the Extension!
                    </Link></p>

                <div className="flex flex-col gap-1 pt-2">
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="workflows" />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="initial-collection-loading">Initial
                            Collection
                            Loading</h2>
                        <div className="collapse-content">

                            <p>ShelfScan provides a streamlined process for the initial loading
                                of your collection into BGG.</p>
                            <p>This workflow requires the <Link className="underline"
                                                                href="/extension">ShelfScan
                                Extension</Link> to be installed in your browser, and for you
                                to be an active <Link className="underline"
                                                      href="https://boardgamegeek.com/support">BGG
                                    Supporter</Link> or Free Trial user.</p>

                            <div className="flex justify-center py-3 px-1">
                                <Link href="/batch"><img className="rounded-md max-w-full max-h-120 border
                                    border-gray-400"
                                                         alt="Batch Scan View"
                                                         src="/images/workflows/batch-scan.jpg" />
                                </Link>
                            </div>

                            <p>Simply go to <Link className="underline"
                                                  href="/batch">Batch
                                Scan View</Link> and begin scanning game UPCs using
                                your
                                camera.
                            </p>
                            <p>There are separate tabs for games that are already in
                                your collection and freshly scanned games, so you can make sure
                                you don't accidentally add duplicates.</p>
                            <p>When you're done with a grouping of games, click
                                the <img alt="Add X Games to Collection"
                                         src="/images/workflows/add-games-to-collection.png"
                                         className="inline-block" /> button
                                to add the games to your BGG
                                collection. You can add duplicates of owned games if you are on
                                the <span className="font-sharetech">Own</span> tab when you click
                                the button.</p>
                            <p>The symbol on the ShelfScan extension will spin, indicating that the
                                BGG
                                update is in progress. Once the symbol stops spinning,
                                the games will have been added to your collection.</p>
                        </div>
                    </div>

                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="workflows" />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="collection-maintenance">Collection
                            Maintenance</h2>
                        <div className="collapse-content">

                            <p>It is simple to maintain an existing BGG collection with ShelfScan
                                as games are added and removed.</p>
                            <p>This workflow requires the <Link className="underline"
                                                                href="/extension">ShelfScan
                                Extension</Link> to be installed in your browser, and for you
                                to be an active <Link className="underline"
                                                      href="https://boardgamegeek.com/support">BGG
                                    Supporter</Link> or Free Trial user.</p>
                            <p>When you acquire new games, add them with the same Batch Scan
                                workflow as described above, or on the <Link className="underline"
                                                                             href="/">Individual
                                    Scan View</Link>.</p>

                            <div className="flex justify-center py-3 px-1">
                                <Link href="/">
                                    <img className="rounded-md max-w-full max-h-120 border border-gray-400"
                                         alt="Individual Scan View"
                                         src="/images/workflows/individual-scan.jpg" />
                                </Link>
                            </div>

                            <p>The Individual Scan view allows you to have more control over the
                                details of the game in your collection, particularly the version
                                of the game that you own. It also puts verification of the mapping
                                between the scanned UPC and the BGG version of the game front and
                                center, which helps to build confidence in the accuracy of
                                everyone's scans.</p>
                            <p>To remove a game from your collection:</p>

                            <div className="flex justify-center py-3 px-1">
                                <video className="max-w-full max-h-120 border border-gray-400 rounded-md"
                                       controls={true}>
                                    <source src="/videos/workflows/clear-status.webm"
                                            type="video/webm" />
                                </video>
                            </div>

                            <ol className="list-decimal pl-5 pt-2">
                                <li>Scan the game from the <Link className="underline" href="/">Individual
                                    Scan View</Link> or look it up in your <Link
                                    className="underline" href="/collection">Collection</Link></li>
                                <li>Click through to the game details page</li>
                                <li>Make sure that the game is marked as in your collection (a
                                    checkmark appears at the top of the page/dialog)
                                </li>
                                <li>Make sure that <img alt="Update in Collection"
                                                        src="/images/workflows/update-in-collection.png"
                                                        className="inline-block"
                                /> is switched on, in the
                                    bottom of the action area, to the right of the game's thumbnail
                                    image on the scan details page, bottom left above the thumbnail
                                    image on the collection details page.
                                </li>
                                <li>Click the arrow next to the <img alt="Set"
                                                                     src="/images/workflows/set-arrow.png"
                                                                     className="inline-block h-6" /> button/dropdown
                                    (the first one) and select <img alt="Clear Statuses"
                                        src="/images/workflows/clear-statuses.png"
                                        className="inline-block h-6" />
                                </li>
                                <li>Make sure that the <img alt="Remove switch"
                                                            src="/images/workflows/remove-switch.png"
                                                            className="inline-block m-0.5"
                                                            /> switch near the button is turned on
                                </li>
                                <li>Click the <img alt="Clear"
                                    src="/images/workflows/clear-button.png"
                                                   className="inline-block h-6"
                                /> button
                                    to remove the game from your
                                    collection
                                </li>
                            </ol>
                            <p>As with other workflows, the symbol on the ShelfScan extension
                                will spin, indicating that the BGG update is in progress. Once
                                the symbol stops spinning, the game will have been removed from
                                your collection.</p>
                            <p>Beyond <span className="font-sharetech">Add</span>,
                                and <span className="font-sharetech">Clear Status</span> discussed above, there are many
                                other collection status update actions you can take
                                from the details page using the first button, such as setting
                                the game as <span className="font-sharetech">For Trade</span> and indicating the trade condition.</p>
                            <p>All the current Add actions are:</p>
                            <ul className="list-disc pl-5">
                                <li>Add to Owned</li>
                                <li>Add for Trade</li>
                                <li>Add to Wishlist</li>
                                <li>Add to Market</li>
                            </ul>
                            <p>All the current Update actions are:</p>
                            <ul className="list-disc pl-5">
                                <li>Set Info (game and version)</li>
                                <li>Set Trade Info (trade condition and for trade status)</li>
                                <li>Set Previously Owned (clears owned status)</li>
                                <li>Clear Statuses (clears all statuses, including owned, for
                                    trade, wishlist, etc.)
                                </li>
                                <li>Add to Market</li>
                                <li>Private Info (set private info such as price paid,
                                    acquisition date, etc.)
                                </li>
                            </ul>
                            <p>An appropriate form will appear as needed for each of these
                                actions.</p>
                        </div>
                    </div>

                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="workflows" />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="collection-audit">Collection
                            Audit</h2>
                        <div className="collapse-content">

                            <p>ShelfScan's collection audit workflow allows you to methodically verify
                                the accuracy of your collection data on BGG, and make additions
                                and subtractions as needed.</p>
                            <p>This workflow requires the <Link className="underline"
                                                                href="/extension">ShelfScan
                                Extension</Link> to be installed in your browser, and for you
                                to be an active <Link className="underline"
                                                      href="https://boardgamegeek.com/support">BGG
                                    Supporter</Link> or Free Trial user.</p>
                            <p><i>Users who do not have the extension can still perform an audit
                                by scanning games, but all BGG updates will need to be
                                done manually.</i></p>
                            <p>For an audit, we expect that you are starting with a collection
                                that has already been loaded on to BGG, and that you have
                                physical games in front of you.</p>
                            <p>Scan the games from the <Link className="underline" href="/">Individual
                                Scan</Link> view.</p>
                            <p>Next, you should either click through to the game details page for
                                each scan if you want to audit game-by-game, or you can continue
                                scanning games.</p>
                            <h3>Clicking Through</h3>
                            <p>If you find a game that is not in your collection, or that has
                                incorrect information, you can update the collection information
                                directly from the details page, as described in the
                                Collection Maintenance workflow above.</p>
                            <h3>Continuing to Scan</h3>
                            <p>With this variant of the workflow, you will scan all or a subset
                                of your games, and then go to the collection view to review
                                which scanned games are not in your collection.</p>
                            <h3>After Scanning</h3>
                            <p>After you have completed scanning, you can go to
                                the <Link className="underline" href="/collection">Collection
                                    View</Link> to review the games which you scanned that are not
                                in
                                your collection and review the games in your collection that you did
                                not scan.</p>
                            <p>To see the games that are not in your collection, click the 'Not
                                in Collection' tab.</p>
                            <p>To see the games that are in your collection but not scanned,
                                click on the 'Scanned' filter button until it turns red with an
                                X mark in the bottom right corner, which limits the games shown
                                to those that do not appear in the scan history that is saved on
                                your device.</p>

                        </div>
                    </div>

                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="workflows" />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="collection-quick-filtering">Collection Quick
                            Filtering</h2>
                        <div className="collapse-content">
                            <p>ShelfScan provides the ability to quickly filter your collection
                                by various criteria, and to sort the filtered collection by
                                several different attributes.</p>
                            <p>The <Link className="underline" href="/extension">ShelfScan
                                Extension</Link> is <b>not</b> required for this workflow, and
                                the <Link
                                    className="underline" href="/collection">Collection
                                    View</Link> in
                                general is available to all users.</p>

                            <div className="flex justify-center py-3 px-1">
                                <img src="/images/workflows/filter-buttons.png"
                                     className="max-w-full"
                                     alt="Filter Buttons" />
                            </div>
                            <p>Above you can see the quick filter buttons and what filtering they
                                are associated with.</p>
                            <p>Most filters have an 'on', 'not', and 'off' state, which you
                                toggle through by clicking on the button.</p>
                            <p>In the 'on' state, only games that match the filter criteria will
                                be shown.</p>
                            <p>In the 'not' state, only games that do not match the filter
                                criteria will be shown.</p>
                            <p>In the 'off' state, the filter is not applied and all games will
                                be shown regardless of that criteria.</p>
                            <p>Some filters, such as the 'Rating' and 'Plays' filters, also have
                                min and max input fields to allow you to narrow the results to a
                                specific range. The 'Wishlist' filter also has a parameter -
                                a priority selection dropdown.</p>
                            <p>You can combine multiple filters to narrow your search and find
                                just the games you are interested in. For example, you could
                                select an 'Owned' filter and 'Rating' filter, and enter min and
                                max rating values to find all the games in your collection that you
                                have rated poorly.</p>
                            <div className="flex justify-center py-3 px-1">
                                <img src="/images/workflows/search-and-sort.png"
                                     className="max-w-full" alt="Search and Sort Bar" />
                            </div>
                            <p>The top of the filter section shows a title text search, a button
                                to turn the filter button bar off, the sorting options, and a
                                button to change the sort direction.</p>
                        </div>
                    </div>
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

                    <p>To use a computer with ShelfScan, on iOS Continuity Camera can be used so
                        that
                        your phone acts as a wireless handheld camera for the application. There are
                        also
                        programs available on Android OS to achieve the same functionality.</p>
                </div>
            </div>
        </div>
    </>;
};

export default WorkflowsPage;

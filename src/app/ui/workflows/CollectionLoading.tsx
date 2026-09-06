import Link from 'next/link';
import React from 'react';

export const CollectionLoading = () => (
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
);

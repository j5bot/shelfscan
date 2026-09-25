import Link from 'next/link';
import React from 'react';

export const CollectionMaintenance = () => (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
        <input type="radio" name="workflows" aria-labelledby="collection-maintenance" />
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
                {/* silent screen recording (its audio track is empty), so no captions are needed */}
                <video className="max-w-full max-h-120 border border-gray-400 rounded-md"
                       controls={true}
                       muted>
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
);

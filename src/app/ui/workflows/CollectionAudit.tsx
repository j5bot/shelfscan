import Link from 'next/link';
import React from 'react';

export const CollectionAudit = () => (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
        <input type="radio" name="workflows" aria-labelledby="collection-audit" />
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
);

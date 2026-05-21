'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaFirefox,
    FaSafari,
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

                <p><Link className="flex items-center justify-center gap-2 uppercase text-lg font-sharetech"
                         href="/extension">
                    <FaFirefox className="w-6 h-6" />
                    <FaSafari className="w-6 h-6" />
                    Get the Extension!
                </Link></p>

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

<ul>
	<li><p><a href="#initial-collection-loading">Initial Collection
	Loading</a></p></li>
	<li><p><a href="#collection-maintenance">Collection Maintenance</a></p></li>
	<li><p><a href="#collection-audit">Collection Audit</a></p></li>
	<li><p><a href="#collection-quick-filtering">Collection Quick
	Filtering</a></p></li>
</ul>

<p>For most uses of ShelfScan, we recommend using the same mobile
device.  The larger the screen, the easier it will be to use the
application.  A small tablet or a phone with a large screen will work
well.</p>

                <h2 className="text-lg pt-2">Initial Collection Loading</h2>

<p>ShelfScan provides a streamlined process for the initial loading
of your collection into BGG.</p>
<p>This workflow requires the <a href="/extension">ShelfScan
Extension</a> to be installed in your browser, and for you
to be an active <a href="https://boardgamegeek.com/support">BGG
Supporter</a> or Free Trial user.</p>
<p>Simply go to <a href="/batch">https://www.shelfscan.io/batch</a>
(Batch Scan in the navigation) and begin scanning game UPCs using your camera.</p>
<p>There are separate tabs for games that are already in
your collection and freshly scanned games, so you can make sure
you don't accidentally add duplicates.</p>
<p>When you're done with a grouping of games, click the 'Add [X] Games to Collection' button to add the games to your BGG
collection. You can add duplicates of owned games if you are on the
'Owned' tab when you click the button.</p>
<p>The symbol on the ShelfScan extension will spin, indicating that the BGG update is in progress. Once the symbol stops spinning,
the games will have been added to your collection.</p>

<h2 className="text-lg pt-2">Collection Maintenance</h2>

<p>It is simple to maintain an existing BGG collection with ShelfScan
as games are added and removed.</p>
<p>This workflow requires the <a href="/extension">ShelfScan
Extension</a> to be installed in your browser, and for you
to be an active <a href="https://boardgamegeek.com/support">BGG
Supporter</a> or Free Trial user.</p>
<p>When you acquire new games, add them with the same Batch Scan
workflow as described above, or on the <a href="/">Individual
Scan</a> view.</p>
<p>The Individual Scan view allows you to have more control over the
details of the game in your collection, particularly the version
of the game that you own. It also puts verification of the mapping
between the scanned UPC and the BGG version of the game front and
center, which helps to build confidence in the accuracy of
everyone's scans.</p>
<p>To remove a game from your collection:</p>
<ul>
	<li><p>Scan the game from the Individual Scan view</p></li>
	<li><p>Click through to the game details page</p></li>
	<li><p>Make sure that the game is marked as in your collection (a
	checkmark appears at the top of the page)</p></li>
	<li><p>Make sure that 'Update in Collection' is switched on, in the
	bottom of the action area, to the right of the game's thumbnail
	image</p></li>
	<li><p>Click the arrow next to the 'Set Info' button/dropdown (the
	first one) and select 'Clear Statuses'</p></li>
	<li><p>Make sure that the 'Remove' switch near the button is turned
	on</p></li>
	<li><p>Click the 'Clear' button to remove the game from your
	collection</p></li>
</ul>
<p>As with other workflows, the symbol on the ShelfScan extension
will spin, indicating that the BGG update is in progress. Once
the symbol stops spinning, the game will have been removed from
your collection.</p>
<p>Beyond 'Add', and 'Clear Status' discussed above, there are many
other collection status update actions you can take
from the details page using the first button, such as setting
the game as 'For Trade' and indicating the trade condition.</p>
<p>All the current 'Add' actions are:</p>
<ul>
	<li><p>Add to Owned</p></li>
	<li><p>Add for Trade</p></li>
	<li><p>Add to Wishlist</p></li>
	<li><p>Add to Market</p></li>
</ul>
<p>All the current 'Update' actions are:</p>
<ul>
	<li><p>Set Info (game and version)</p></li>
	<li><p>Set Trade Info (trade condition and for trade status)</p></li>
	<li><p>Set Previously Owned (clears owned status)</p></li>
	<li><p>Clear Statuses (clears all statuses, including owned, for
	trade, wishlist, etc.)</p></li>
	<li><p>Add to Market</p></li>
	<li><p>Private Info (set private info such as price paid,
	acquisition date, etc.)</p></li>
</ul>
<p>An appropriate form will appear as needed for each of these
actions.</p> 


<h2 className="text-lg pt-2">Collection Audit</h2>

<p>ShelfScan's collection audit workflow allows you to quickly verify
the accuracy of your collection data on BGG, and make additions
and subtractions as needed.</p>
<p>This workflow requires the <a href="/extension">ShelfScan
Extension</a> to be installed in your browser, and for you
to be an active <a href="https://boardgamegeek.com/support">BGG
Supporter</a> or Free Trial user.</p>
<p><i>Users who do not have the extension can still perform an audit
by scanning games, but all BGG updates will need to be
done manually.</i></p>
<p>For an audit, we expect that you are starting with a collection
that has already been loaded on to BGG, and that you have
physical games in front of you.</p>
<p>Scan the games from the <a href="/">Individual
Scan</a> view.</p>
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
<p>After you have completed scanning, you can go to the <a href="/collection">Collection
View</a> to review the games which you scanned that are not in
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
    </>;
};

export default WorkflowsPage;

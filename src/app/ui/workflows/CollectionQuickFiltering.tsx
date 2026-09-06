import Link from 'next/link';

export const CollectionQuickFiltering = () => (
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
);

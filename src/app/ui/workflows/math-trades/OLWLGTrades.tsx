import Link from 'next/link';
import React from 'react';
import { FaRightLeft } from 'react-icons/fa6';

export const OLWLGTrades = () => (
    <>
        <p>Navigate to the <Link href="/math-trade">Math Trade</Link> page and click{' '}
            <button className="btn btn-md bg-purple-800 text-white rounded-md font-semibold"
            >Use OLWLG Math Trade</button></p>
        <figure>
            <img src="/images/workflows/enter-geeklist-id.png" alt="Enter geeklist URL" />
            <figcaption className="italic">Enter the Math Trade geeklist URL</figcaption>
        </figure>
        <p>
            Search by name, version, tags and filter your collection in any way you want.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/filter-buttons.png" alt="Filter buttons" />
            <figcaption className="italic">Collection filter options</figcaption>
        </figure>
        <p>
            Click on the condition display box to open the Math Trade property edit form.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/math-trade-edit-form-click.jpg"
                 alt="Math Trade condition display box" />
            <figcaption className="italic">Opening the property edit form</figcaption>
        </figure>
        <p>
            Edit the condition/description and copies values and click on "Done" when finished.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/math-trade-edit-form.jpg"
                 alt="Math Trade condition form" />
            <figcaption className="italic">Edit the trade item properties</figcaption>
        </figure>
        <p>
            If adding only a few items, or if you're not using the extension, you may want to click
            on
            <button
                type="button"
                className={`btn rounded-full mt-2
                w-fit px-7
                bg-brand-background text-white
                uppercase text-xs font-sharetech
                pt-1 pb-1
                pointer-events-none`}
                aria-label={`Add item to math trade`}
            >Add to Trade</button>
        </p>
        <p>
            If the collection item is already in the OLWLG geeklist, the button
            will have a warning color
            <button
                type="button"
                className={`btn rounded-full mt-2
                w-fit px-7
                btn-warning
                uppercase text-xs font-sharetech
                pt-1 pb-1
                pointer-events-none`}
                aria-label={`Add item to math trade`}
            >Add to Trade</button>
        </p>
        <p>
            Click on the item thumbnail to select it for batch adding.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/math-trade-click-thumb.jpg"
                 alt="Click thumbnail to add to batch" />
            <figcaption className="italic">Click thumbnail to add to batch</figcaption>
        </figure>
        <p>
            Click on the open link to open the details modal to set version information.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/math-trade-set-version.jpg"
                 alt="Click open link to set version" />
            <figcaption className="italic">Click open link to set version</figcaption>
        </figure>
        <p>
            Scroll to the top of the collection display and click the button to batch add the
            selected items
            <button
                type="button"
                className={`btn rounded-full
                                        bg-brand-background text-white
                                        flex items-center justify-center gap-2
                                        uppercase text-base font-sharetech
                                        mt-2
                                        pointer-events-none
                                        pl-6 pr-6 pt-2 pb-2`}
                aria-label={`Add 2 games to math trade geeklist`}
            ><FaRightLeft className="w-4 h-4" />
                Add 2 to Math Trade
            </button>
        </p>
    </>
);

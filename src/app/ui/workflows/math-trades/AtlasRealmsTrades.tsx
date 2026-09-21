import Link from 'next/link';
import React from 'react';
import { FaFileExport } from 'react-icons/fa6';

export const AtlasRealmsTrades = () => (
    <>
        <p>Navigate to the <Link href="/swap">Swaptagon Math Trade</Link> page.</p>
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
            <img className="max-w-4/5" src="/images/workflows/swap-condition-area.jpg"
                 alt="Math Trade condition display box" />
            <figcaption className="italic">Opening the property edit form</figcaption>
        </figure>
        <p>
            Edit the condition/description, compare value and sell for values and click on "Done" when finished.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/swap-condition-form.jpg"
                 alt="Math Trade condition edit form" />
            <figcaption className="italic">Edit the trade item properties</figcaption>
        </figure>
        <p>
            Click on the item thumbnail to select it for batch adding.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/swap-click-thumb.jpg"
                 alt="Click thumbnail to add to batch" />
            <figcaption className="italic">Click thumbnail to add to batch</figcaption>
        </figure>
        <p>
            Click on the open link to open the details modal to set version information.
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/swap-select-version.jpg"
                 alt="Click open link to set version" />
            <figcaption className="italic">Click open link to set version</figcaption>
        </figure>
        <p>
            Scroll to the top of the collection display and click the button to export the
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
            ><FaFileExport className="w-4 h-4" />
                Export 2 for Swaptagon
            </button>
        </p>
        <figure>
            <img className="max-w-4/5" src="/images/workflows/file-export-dialog.jpg"
                 alt="File export save dialog" />
            <figcaption className="italic">Save the file export</figcaption>
        </figure>
        <p>
            After saving the export, you'll need to import it into Swaptagon.
        </p>
        <p>
            Install the <Link href="https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importSwap.user.js"
                              target="_blank" className="underline">userscript</Link>
        </p>
    </>
);

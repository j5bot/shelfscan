import { BadgeWithHelpTip } from '@/app/ui/BadgeWithHelpTip';
import Link from 'next/link';
import React from 'react';
import { FaDice, FaPlus, FaThumbsUp } from 'react-icons/fa6';

const scanTooltipContent = <div className="text-left p-2">
    <ol>
        <li>Allow camera</li>
        <li>Scan game UPC</li>
        <li>Click game in list</li>
        <li>View matches</li>
        <li>Open on BGG &amp; more</li>
    </ol>
</div>;

const auditTooltipContent = <div className="text-left p-2">
    <ol>
        <li>Sign in</li>
        <li>Scan game UPC</li>
        <li>Click game in list</li>
        <li>Select game &amp; version</li>
        <li>Look for checkmarks</li>
    </ol>
</div>;

const exploreTooltipContent = <div className="text-left p-2">
    <ol>
        <li>Sign in</li>
        <li>
            Go to <Link href="/collection" className="underline">collection</Link>
        </li>
        <li>Explore &amp; filter</li>
    </ol>
</div>;

const updateGameUPCTooltipContent = <div className="text-left p-2">
    <ol>
        <li>Scan game UPC</li>
        <li>Click game in list</li>
        <li>Select game &amp; version</li>
        <li className="flex gap-2 items-center">Click <FaThumbsUp size={10} /></li>
    </ol>
</div>;

const logPlayTooltipContent = <div className="text-left p-2">
    <ol>
        <li>Install <Link href="/extension">extension</Link></li>
        <li>Sign up for trial</li>
        <li>Sign in</li>
        <li>Scan game UPC</li>
        <li>Click game in list</li>
        <li>Select game if necessary</li>
        <li className="flex gap-2 items-center h-5 md:h-6">
            Click
            <button
                className={`rounded-lg
                        bg-[#e07ca4dc] border-[#e07ca4ff] text-white p-1
                        w-fit gap-1 mt-1 items-center
                        text-xs flex uppercase font-bold`}
            >
                <FaDice className="w-4 h-4 shrink-0" /> Play
            </button>
        </li>
    </ol>
</div>;

const addToCollectionTooltipContent = <div className="text-left p-2">
    <ol>
        <li>Install <Link href="/extension">extension</Link></li>
        <li>Sign up for trial</li>
        <li>Sign in</li>
        <li>Scan game UPC</li>
        <li>Click game in list</li>
        <li>Select game &amp; version</li>
        <li className="flex gap-2 items-center h-5 md:h-6">
            Click
            <button
                className={`rounded-lg
                        bg-[#e07ca4dc] border-[#e07ca4ff] text-white p-1
                        w-fit gap-1 mt-1 flex items-center
                        text-xs uppercase font-bold`}
            >
                <FaPlus className="w-2 h-2 md:w-3 md:h-3" /> Add
            </button>
        </li>
    </ol>
</div>;

export const UseCaseBadges = () => {
    const commonClasses = 'badge-lg shadow-sm py-2';
    return (
        <>
            <div className="flex flex-wrap gap-1 justify-center ">
                <BadgeWithHelpTip
                    tooltipContent={scanTooltipContent}
                    className={`${commonClasses} text-[#e07ca4ee]`}
                    locationClassName="tooltip-top"
                >
                    Scan
                </BadgeWithHelpTip>
                <BadgeWithHelpTip
                    tooltipContent={auditTooltipContent}
                    className={`${commonClasses} text-[#669966cc]`}
                    locationClassName="tooltip-top"
                >
                    Audit
                </BadgeWithHelpTip>
                <BadgeWithHelpTip
                    tooltipContent={exploreTooltipContent}
                    className={`${commonClasses} text-[#5107df66] dark:text-[#dd07dfee]`}
                    locationClassName="tooltip-top"
                >
                    Explore Collection
                </BadgeWithHelpTip>
                {/*<BadgeWithHelpTip*/}
                {/*    tooltipContent={updateGameUPCTooltipContent}*/}
                {/*    className={`${commonClasses} text-[#ff6900aa]`}*/}
                {/*    locationClassName="tooltip-top"*/}
                {/*>*/}
                {/*    Update{' '}*/}
                {/*    <Link className="underline" href="https://gameupc.com" target="_blank">*/}
                {/*        GameUPC*/}
                {/*    </Link>*/}
                {/*</BadgeWithHelpTip>*/}
            </div>
            <h3 className="py-3">
                With the <Link href="/extension/"
                               className="underline" target="_blank">Browser Extension</Link>
            </h3>
            <div className="flex flex-wrap gap-1 justify-center ">
                <BadgeWithHelpTip
                    tooltipContent={logPlayTooltipContent}
                    className={`${commonClasses} text-[#e07ca4ee]`}
                >
                    Log Plays
                </BadgeWithHelpTip>
                <BadgeWithHelpTip
                    tooltipContent={addToCollectionTooltipContent}
                    className={`${commonClasses} text-[#669966cc]`}
                >
                    Add to Collection*
                </BadgeWithHelpTip>
                <span className={`${commonClasses}
                    cursor-pointer badge text-[#5107df66] dark:text-[#dd07dfee]`}>
                    <Link className="underline"
                          href="/workflows/"
                          target="_blank">More!</Link>
                </span>
            </div>
        </>
    );
};

import { BadgeWithHelpTip } from '@/app/ui/BadgeWithHelpTip';
import Link from 'next/link';
import React from 'react';
import { FaPlus, FaThumbsUp } from 'react-icons/fa6';

const AuditTooltipContent = () => {
    return <div className="text-left p-2">
        <ol>
            <li>Sign in</li>
            <li>Scan game UPC</li>
            <li>Click game in list</li>
            <li>Select game &amp; version</li>
            <li>Look for checkmarks</li>
        </ol>
    </div>
};

const UpdateGameUPCTooltipContent = () => {
    return <div className="text-left p-2">
        <ol>
            <li>Scan game UPC</li>
            <li>Click game in list</li>
            <li>Select game &amp; version</li>
            <li className="flex gap-2 items-center">Click <FaThumbsUp size={10} /></li>
        </ol>
    </div>
};

const AddToBGGCollectionTooltipContent = () => {
    return <div className="text-left p-2">
        <ol>
            <li>* Install extension (coming soon)</li>
            <li>Sign in</li>
            <li>Scan game UPC</li>
            <li>Click game in list</li>
            <li>Select game &amp; version</li>
            <li className="flex gap-2 items-center h-5 md:h-6">
                Click
                <button
                    className={`rounded-full
                        bg-[#e07ca4dc] border-[#e07ca4ff] text-white p-1
                        h-4 w-4 md:h-5 md:w-5
                        text-xs inline-block`}
                >
                    <FaPlus className="w-2 h-2 md:w-3 md:h-3" />
                </button>
            </li>
        </ol>
    </div>
};

export const UseCaseBadges = () => {
    return (
        <div className="flex flex-wrap gap-1 justify-center">
            <BadgeWithHelpTip
                tooltipContent={<AuditTooltipContent />}
                className="badge-sm text-[#e07ca4ee] shadow-sm"
                locationClassName="tooltip-top"
            >
                Audit BGG Collection
            </BadgeWithHelpTip>
            <BadgeWithHelpTip
                tooltipContent={<UpdateGameUPCTooltipContent />}
                className="badge-sm text-[#669966cc] shadow-sm"
                locationClassName="tooltip-top"
            >
                Update <Link className="underline" href="https://gameupc.com" target="_blank">
                    GameUPC
                </Link>
            </BadgeWithHelpTip>
            <BadgeWithHelpTip
                tooltipContent={<AddToBGGCollectionTooltipContent />}
                className="badge badge-sm text-[#5107df66] dark:text-[#dd07dfee] shadow-sm"
            >
                Add to BGG Collection*
            </BadgeWithHelpTip>
            <span className="cursor-pointer badge badge-sm text-[#ff6900aa] shadow-sm">and ...
                <Link className="underline"
                      href="https://boardgamegeek.com/blog/16520/shelfscan-news"
                      target="_blank">More!</Link>
            </span>
        </div>
    )
};

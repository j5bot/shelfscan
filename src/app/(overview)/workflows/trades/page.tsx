'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { OLWLGTrades } from '@/app/ui/workflows/math-trades/OLWLGTrades';
import React, { useState } from 'react';

const MathTradeWorkflowsPage = () => {
    useTitle('ShelfScan | Math Trade Workflows');
    const [openSection, setOpenSection] = useState<string>();

    const handleAccordionClick = (event: React.MouseEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        if (openSection === input.value) {
            input.checked = false;
            setOpenSection(undefined);
            return false;
        }
        setOpenSection(input.value);
    };

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center">
                    ShelfScan Math Trade Workflows
                </h1>

                <div className="flex flex-col gap-1 pt-2">
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="math-trades"
                               className="cursor-pointer"
                               value="olwlg"
                               onClick={handleAccordionClick}
                        />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="math-trades-olwlg">OLWLG</h2>
                        <div className="collapse-content">
                            <OLWLGTrades />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>;
};

export default MathTradeWorkflowsPage;

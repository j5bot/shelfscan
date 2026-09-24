'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { OLWLGTrades } from '@/app/ui/workflows/math-trades/OLWLGTrades';
import { SwaptagonTrades } from '@/app/ui/workflows/math-trades/SwaptagonTrades';
import React, { useRef } from 'react';

const MathTradeWorkflowsPage = () => {
    useTitle('ShelfScan | Math Trade Workflows');
    const openSectionRef = useRef<string>(undefined);

    const handleAccordionClick = (event: React.MouseEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        if (openSectionRef.current === input.value) {
            input.checked = false;
            openSectionRef.current = undefined;
            return false;
        }
        openSectionRef.current = input.value;
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
                               aria-labelledby="math-trades-olwlg"
                               onClick={handleAccordionClick}
                        />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="math-trades-olwlg">OLWLG</h2>
                        <div className="collapse-content">
                            <OLWLGTrades />
                        </div>
                    </div>
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="math-trades"
                               className="cursor-pointer"
                               value="swaptagon"
                               aria-labelledby="math-trades-swaptagon"
                               onClick={handleAccordionClick}
                        />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="math-trades-swaptagon">Swaptagon</h2>
                        <div className="collapse-content">
                            <SwaptagonTrades />
                        </div>
                    </div>
                    <div className="collapse collapse-arrow bg-base-100 border border-base-300 text-sm">
                        <input type="radio" name="math-trades"
                               className="cursor-pointer"
                               value="atlas-realms"
                               aria-labelledby="math-trades-atlas-realms"
                               onClick={handleAccordionClick}
                        />
                        <h2 className="collapse-title text-lg px-3 py-0.5"
                            id="math-trades-atlas-realms">Atlas Realms</h2>
                        <div className="collapse-content">
                            <p>Workflow coming soon.</p>
                            {/*<AtlasRealmsTrades />*/}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>;
};

export default MathTradeWorkflowsPage;

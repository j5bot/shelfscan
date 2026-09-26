import { getTradeActionLabels, TradeActionMode } from '@/app/lib/utils/trade';
import { FaFileExport, FaRightLeft } from 'react-icons/fa6';

type TradeActionBarProps = {
    mode: TradeActionMode;
    selectedCount: number;
    actionableCount: number;
    isBusy: boolean;
    onAction: () => void;
};

export const TradeActionBar = ({ mode, selectedCount, actionableCount, isBusy, onAction }: TradeActionBarProps) => {
    const { label, ariaLabel } = getTradeActionLabels(mode, actionableCount);
    const hint = mode.hasTrade ? 'Click image to select for export' : 'Click image to select for Math Trade';

    let icon = <FaFileExport className="w-4 h-4" />;
    switch (true) {
        case isBusy:
            icon = <span className="loading loading-bars loading-sm" />;
            break;
        case mode.isMathTrade:
            icon = <FaRightLeft className="w-4 h-4" />;
            break;
    }

    return <div className="flex items-center justify-between gap-2 pt-2 p-2 bg-overlay">
        <span className="text-xs text-base-content/60">
            {selectedCount > 0 ? `${selectedCount} selected` : hint}
        </span>
        {actionableCount > 0 && (
            <button
                type="button"
                className={`btn rounded-full pointer-events-auto
                    bg-brand-background text-white
                    flex items-center justify-center gap-2
                    uppercase text-base font-sharetech
                    pl-6 pr-6 pt-2 pb-2
                    ${isBusy ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#d06b93] cursor-pointer'}`}
                onClick={onAction}
                disabled={isBusy}
                aria-label={ariaLabel}
            >
                {icon}
                {label}
            </button>
        )}
    </div>;
};

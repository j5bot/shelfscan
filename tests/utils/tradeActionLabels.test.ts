import { describe, it, expect } from '../setup';
import { getTradeActionLabels } from '@/app/lib/utils/trade';

const mode = (route: 'math-trade' | 'swap' | 'trade') => ({
    hasExport: route !== 'math-trade',
    isMathTrade: route === 'math-trade',
    isSwap: route === 'swap',
    isTrade: route === 'trade',
});

describe('getTradeActionLabels', () => {
    it('adds to the math trade geeklist on the math-trade route', () => {
        expect(getTradeActionLabels(mode('math-trade'), 2)).toEqual({
            label: 'Add 2 to Math Trade',
            ariaLabel: 'Add 2 games to math trade geeklist',
        });
    });

    it('exports for Swaptagon on the swap route', () => {
        expect(getTradeActionLabels(mode('swap'), 1)).toEqual({
            label: 'Export 1 for Swaptagon',
            ariaLabel: 'Export 1 game to ODS',
        });
    });

    it('exports for Atlas on the trade route', () => {
        expect(getTradeActionLabels(mode('trade'), 3)).toEqual({
            label: 'Export 3 for Atlas',
            ariaLabel: 'Export 3 games to ODS',
        });
    });
});

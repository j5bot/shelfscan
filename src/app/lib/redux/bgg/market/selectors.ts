import { RootState } from '@/app/lib/redux/store';
import { GeekMarketProduct } from '@/app/lib/types/market';
import { memoize } from 'proxy-memoize';

export const selectMarketListings =
    memoize(([state, username]: [RootState, string | undefined]): GeekMarketProduct[] => {
        if (!username) {
            return [];
        }
        return state.bgg.market.users[username.toLowerCase()] ?? [];
    }, { size: 100 });

export const selectMarketObjectIds =
    memoize(([state, username]: [RootState, string | undefined]): Set<string> => {
        if (!username) {
            return new Set();
        }
        const listings = state.bgg.market.users[username.toLowerCase()] ?? [];
        return new Set(listings.map(p => p.objectid));
    }, { size: 100 });

export const selectMarketVersionIds =
    memoize(([state, username]: [RootState, string | undefined]): Set<string> => {
        if (!username) {
            return new Set();
        }
        const listings = state.bgg.market.users[username.toLowerCase()] ?? [];
        return new Set(listings.map(p => p.version?.id).filter(x => x));
    }, { size: 100 });

'use client';

import { getMarket } from '@/app/lib/database/database';
import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { setMarketListings } from '@/app/lib/redux/bgg/market/slice';
import { selectMarketListings } from '@/app/lib/redux/bgg/market/selectors';
import { RootState } from '@/app/lib/redux/store';
import { GeekMarketProduct } from '@/app/lib/types/market';
import { useCallback, useEffect, useRef, useState } from 'react';

type UseMarketDataResult = {
    products: GeekMarketProduct[];
    isLoading: boolean;
    loadMarket: () => void;
};

const emptyProducts: GeekMarketProduct[] = [];

export const useMarketData = (): UseMarketDataResult => {
    const dispatch = useDispatch();
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const userId = useSelector((state: RootState) => state.bgg.user?.id);

    const products = useSelector((state: RootState) =>
        selectMarketListings([state, username]),
    );

    const [isLoading, setIsLoading] = useState(false);
    const loadingRef = useRef(false);

    const loadMarket = useCallback(() => {
        if (!userId || loadingRef.current) { return; }
        loadingRef.current = true;
        setIsLoading(true);
        void dispatchExtensionMessage({ type: 'marketLoad', userId })
            ?.then(() => {
                loadingRef.current = false;
                setIsLoading(false);
            });
    }, [userId, dispatchExtensionMessage]);

    // Hydrate from cache on mount. Caller is responsible for triggering loadMarket()
    // at the right time (e.g. when the market tab is first opened).
    useEffect(() => {
        if (!username || products.length > 0) { return; }
        let active = true;
        getMarket(username.toLowerCase()).then(stored => {
            if (!active) { return; }
            if (stored?.length) {
                dispatch(setMarketListings({ username, products: stored }));
            }
        });
        return () => { active = false; };
    }, [username, dispatch]);

    useEffect(() => {
        if (products.length > 0 && loadingRef.current) {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [products.length]);

    return {
        products: products ?? emptyProducts,
        isLoading,
        loadMarket,
    };
};

import ExtPay from '@/app/lib/extension/ExtPay.browser';
import { ExtPayBrowser } from '@/app/lib/extension/ExtPay.browser.types';
import { useCallback, useEffect, useState } from 'react';

export const useExtPay = () => {
    const [extPay, setExtPay] = useState<ExtPayBrowser>();

    useEffect(() => {
        if (extPay) {
            return;
        }
        setExtPay(ExtPay('shelfscan'));
    }, [extPay]);

    const openTrialPage = useCallback(() => {
        if (!extPay) {
            return;
        }
        extPay?.openTrialPage();
    }, [extPay]);

    const openPaymentPage = useCallback(() => {
        if (!extPay) {
            return;
        }
        extPay?.openPaymentPage();
    }, [extPay]);

    const copyPromoCode = useCallback(() => {
        void navigator.clipboard.writeText('2BUCKS');
    }, []);

    return {
        extPay,
        openTrialPage,
        openPaymentPage,
        copyPromoCode,
    };
};

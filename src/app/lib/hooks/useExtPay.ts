import ExtPay from '@/app/lib/extension/ExtPay.browser';
import { ExtPayBrowser } from '@/app/lib/extension/ExtPay.browser.types';
import { useCallback } from 'react';

// created on first use: ExtPay needs window.localStorage, so it can't run during server rendering
let extPayInstance: ExtPayBrowser | undefined;
const getExtPay = () => (extPayInstance ??= ExtPay('shelfscan'));

export const useExtPay = () => {
    const openTrialPage = useCallback(() => {
        getExtPay().openTrialPage();
    }, []);

    const openPaymentPage = useCallback(() => {
        getExtPay().openPaymentPage();
    }, []);

    const copyPromoCode = useCallback(() => {
        void navigator.clipboard.writeText('2BUCKS');
    }, []);

    return {
        openTrialPage,
        openPaymentPage,
        copyPromoCode,
    };
};

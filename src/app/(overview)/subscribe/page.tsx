'use client';

import { useExtPay } from '@/app/lib/hooks/useExtPay';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import {
    FaCopy,
} from 'react-icons/fa6';

const SubscribePage = () => {
    useTitle('ShelfScan | Subscribe');

    const {
        copyPromoCode,
        openPaymentPage,
        openTrialPage,
    } = useExtPay();

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">
                    Extension Trial & Subscription
                </h1>

                <h3 className="font-semibold">Subscribe to the Browser Extension and Do More</h3>

                <p>
                    ShelfScan works together with a <Link href="/extension" target="_blank">browser extension</Link>{' '}
                    for the Gear browser on iOS, Firefox browser on Android,
                    and Chrome, Firefox, and others on Desktop,
                    to add lots of extra features that bring together BGG and the web app with a
                    low-cost subscription (<Link href="/why-subscribe/"
                                                 className="underline" target="_blank">why a subscription?</Link>) .
                </p>

                <p className="text-xl uppercase font-sharetech">
                    1 Year Subscription for $2 with code <button className="btn btn-outline rounded-md inline-flex items-center gap-1"
                                                                  onClick={copyPromoCode}
                                                                  aria-label="Copy promo code 2BUCKS"
                                                                  title="Copy to clipboard">2BUCKS <FaCopy size={12} /></button>
                </p>

                <div className="pt-3">
                    <button className="bg-brand-background rounded-xl text-white btn mr-3"
                            onClick={openTrialPage}><span className="line-through">3</span> 30 Day Free Trial</button>
                    <button className="bg-brand-background rounded-xl text-white btn"
                            onClick={openPaymentPage}>Subscribe to ShelfScan</button>

                </div>
                <p>
                    After you sign up for a free trial or subscription,
                    install the <Link href="/extension" target="_blank">Extension</Link>
                </p>
            </div>
        </div>
    </>;
};

export default SubscribePage;

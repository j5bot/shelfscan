import { SetFormValue } from '@/app/lib/extension/types';
import { useEffect, useState } from 'react';

const paymentMethodOptions = [
    { value: 'paypal', label: 'PayPal' },
    { value: 'moneyorder', label: 'Money Order' },
    { value: 'personalcheck', label: 'Pers. Check' },
    { value: 'cod', label: 'COD' },
    { value: 'otheronline', label: 'Other Online' },
    { value: 'other', label: 'See Notes' },
]

export const PaymentMethodSelect = ({
    paymentMethod = ['other'],
    setValue
} : {
    paymentMethod?: string[];
    setValue: SetFormValue;
}) => {
    const [paymentMethodValues, setPaymentMethodValues] =
        useState<string[] | undefined>(paymentMethod);

    useEffect(() => {
        setPaymentMethodValues(paymentMethod);
    }, [paymentMethod]);

    return <>
        <input type="hidden" name="paymentMethod"
               value={paymentMethodValues?.join(',')} />
        <select multiple={true}
                className="grow select select-condensed text-xs w-full input h-10 ios-safari:h-6 pl-1.5 p-1"
                value={paymentMethodValues}
                onChange={event => {
                    const values = Array.from(event.currentTarget
                        .selectedOptions)?.map(option => option.value);
                    setPaymentMethodValues(values);
                    setValue('paymentMethod', values.join(','));
                }}
        >
            {paymentMethodOptions.map(paymentMethod =>
                <option key={paymentMethod.value}
                        value={paymentMethod.value}>{paymentMethod.label}</option>
            )}
        </select>
    </>
};

import { SetFormValue } from '@/app/lib/extension/types';
import { useState } from 'react';

const paymentMethodOptions = [
    { value: 'paypal', label: 'PayPal' },
    { value: 'moneyorder', label: 'Money Order' },
    { value: 'personalcheck', label: 'Pers. Check' },
    { value: 'cod', label: 'COD' },
    { value: 'otheronline', label: 'Other Online' },
    { value: 'other', label: 'See Notes' },
]

export const PaymentMethodSelect = ({
    id,
    paymentMethod = ['other'],
    setValue
} : {
    id?: string;
    paymentMethod?: string[];
    setValue: SetFormValue;
}) => {
    // the user's selection, kept with the prop value it was made against so a new prop resets it
    const paymentMethodKey = paymentMethod.join(',');
    const [override, setOverride] = useState<{ key: string; values: string[] }>();
    const paymentMethodValues = override?.key === paymentMethodKey ? override.values : paymentMethod;

    return <>
        <input type="hidden" name="paymentMethod"
               value={paymentMethodValues?.join(',')} />
        <select id={id}
                multiple={true}
                aria-label="Payment methods"
                className="grow select select-condensed text-xs w-full input h-12 ios-safari:h-6 p-1"
                value={paymentMethodValues}
                onChange={event => {
                    const values = Array.from(event.currentTarget
                        .selectedOptions)?.map(option => option.value);
                    setOverride({ key: paymentMethodKey, values });
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

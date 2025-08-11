import { ModeSettingFormProps } from '@/app/lib/extension/types';
import { useSettings } from '@/app/lib/SettingsProvider';
import { MarketPreferences } from '@/app/lib/types/market';
import { ConditionSelect } from '@/app/ui/forms/ConditionSelect';
import { CountrySelect } from '@/app/ui/forms/CountrySelect';
import { CurrencySelect } from '@/app/ui/forms/CurrencySelect';
import { NotesTextArea } from '@/app/ui/forms/NotesTextArea';
import { PaymentMethodSelect } from '@/app/ui/forms/PaymentMethodSelect';
import { PriceInput } from '@/app/ui/forms/PriceInput';
import { ShipSelect } from '@/app/ui/forms/ShipSelect';
import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { FaBox, FaCreditCard } from 'react-icons/fa6';

export const AddToMarketForm = ({ formValues, setFormValues }: ModeSettingFormProps) => {
    const { settings: { marketPreferences = {} } } = useSettings();
    const preferences = marketPreferences as MarketPreferences;

    const hasPreferences = Object.keys(preferences).length > 0;

    const values = Object.assign({},
        preferences,
        formValues,
    );

    const makeShouldShowField = (field: keyof MarketPreferences) =>
        !preferences[field] ||
            preferences[field] !== formValues?.[field];

    const setValue = (field: string, value: string) => {
        setFormValues(Object.assign(values, { [field]: value }));
    };

    const showCondition = makeShouldShowField('condition');
    const showNotes = makeShouldShowField('notes');
    const showPaymentMethod = makeShouldShowField('paymentMethod');
    const showCountry = makeShouldShowField('country');
    const showShipLocation = makeShouldShowField('shipLocation');
    const showShipAreas = makeShouldShowField('shipAreas');
    const showShipSelect = (showShipLocation && showShipAreas) || (
        formValues?.['shipLocation'] !== 'usandothers' &&
        !showShipAreas
    );

    const showCurrencyAndPrice = <>
        <CurrencySelect currency={values?.['currency'] ?? 'USD'}
                        setValue={setValue}
                        disabled={!!preferences['currency']}
        />
        <PriceInput price={values?.['price'] ?? ''}
                    setValue={setValue}
                    disabled={!!preferences['price']}
        />
    </>;
    const defaultCurrencyAndPrice = <>
        <CurrencySelect currency={values?.['currency'] ?? 'USD'}
                        setValue={setValue}
                        disabled={!preferences['currency']}
        />
        <PriceInput price={values?.['price'] ?? ''}
                    setValue={setValue}
                    disabled={!preferences['price']}
        />
    </>;

    const condition = <ConditionSelect
        condition={formValues?.['condition'] ?? 'verygood'}
        setValue={setValue}
    />;
    const notes = <NotesTextArea notes={values?.['notes'] ?? ''} setValue={setValue} />;
    const paymentMethod = (showIcon: boolean) => (<div className="flex gap-0.5 items-center">
        {showIcon && <FaCreditCard className="h-4 w-4 mr-0.5" />}
        <PaymentMethodSelect
            paymentMethod={values?.['paymentMethod']?.split(',') ?? ['other']}
            setValue={setValue} />
    </div>);
    const country = (showIcon: boolean) => (<div className="flex gap-0.5 items-center">
        {showIcon && <FaMapMarkerAlt className="h-4 w-3.5 mr-0.5" />}
        <CountrySelect
            country={values?.['country'] ?? 'United States'}
            setValue={setValue}
        />
    </div>);
    const shipSelect = (showIcon: boolean) => (<div className="flex gap-0.5 items-start">
        {showIcon && <FaBox size={13} className="mt-2 mr-0.5" />}
        <div className="flex flex-wrap gap-0.5">
            <ShipSelect
                shipLocation={values?.['shipLocation'] ?? 'usonly'}
                shipAreas={values?.['shipAreas']?.split(',')}
                setValue={setValue}
            />
        </div>
    </div>);

    return <form name="sell" className="flex flex-wrap gap-1 pb-2 pr-1.5">
        <div className="flex gap-0.5">
            {showCurrencyAndPrice}
        </div>
        {showCondition && condition}
        {showNotes && notes}
        {showPaymentMethod && paymentMethod(true)}
        {showCountry && country(true)}
        {showShipSelect && shipSelect(true)}
        {hasPreferences && <div className="collapse collapse-arrow collapse-xs text-xs">
            <input type="checkbox" />
            <div className="collapse-title p-1.5 m-0">More Fields</div>
            <div className="collapse-content flex flex-wrap gap-1 pr-1 pl-1">
                <div className="flex gap-0.5">
                    {defaultCurrencyAndPrice}
                </div>
                {!showCondition && condition}
                {!showNotes && notes}
                {!showPaymentMethod && paymentMethod(false)}
                {!showCountry && country(false)}
                {!showShipSelect && shipSelect(false)}
            </div>
        </div>}
    </form>;
};
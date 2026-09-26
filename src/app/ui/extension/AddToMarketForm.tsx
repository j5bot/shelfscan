import { ModeSettingFormProps, SetFormValue } from '@/app/lib/extension/types';
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

type MarketValues = MarketPreferences & Record<string, string | number | undefined>;

type MarketFieldName = 'condition' | 'notes' | 'paymentMethod' | 'country' | 'shipSelect';

// rendered in this order, both up front and under "More Fields"
const MarketFieldNames: MarketFieldName[] = ['condition', 'notes', 'paymentMethod', 'country', 'shipSelect'];

/**
 * A field is shown up front unless the user has a saved default for it that the
 * current value still matches; matching defaults are tucked under "More Fields".
 */
const getVisibleMarketFields = (preferences: MarketPreferences, values: MarketValues): Record<MarketFieldName, boolean> => {
    const differsFromDefault = (field: keyof MarketPreferences) =>
        !preferences[field] || preferences[field] !== (values[field] ?? '');

    const showShipLocation = differsFromDefault('shipLocation');
    const showShipAreas = differsFromDefault('shipAreas');

    return {
        condition: differsFromDefault('condition'),
        notes: differsFromDefault('notes'),
        paymentMethod: differsFromDefault('paymentMethod'),
        country: differsFromDefault('country'),
        shipSelect: (showShipLocation && showShipAreas) || (
            values?.['shipLocation'] !== 'usandothers' &&
            !showShipAreas
        ),
    };
};

type MarketFieldProps = {
    field: MarketFieldName;
    showIcon: boolean;
    values: MarketValues;
    setValue: SetFormValue;
};

const MarketField = (props: MarketFieldProps) => {
    const { field, showIcon, values, setValue } = props;

    switch (field) {
        case 'condition':
            return <ConditionSelect condition={values?.['condition'] ?? 'verygood'} setValue={setValue} />;
        case 'notes':
            return <NotesTextArea notes={values?.['notes'] ?? ''} setValue={setValue} />;
        case 'paymentMethod':
            return <div className="flex gap-0.5 items-center w-full">
                {showIcon && <FaCreditCard className="h-4 w-4 mr-0.5" />}
                <PaymentMethodSelect
                    paymentMethod={values?.['paymentMethod']?.split(',') ?? []}
                    setValue={setValue} />
            </div>;
        case 'country':
            return <div className="flex gap-0.5 items-center w-full">
                {showIcon && <FaMapMarkerAlt className="h-4 w-4 mr-0.5" />}
                <CountrySelect
                    country={values?.['country'] ?? 'United States'}
                    setValue={setValue}
                />
            </div>;
        case 'shipSelect':
            return <div className="flex gap-0.5 items-start w-full">
                {showIcon && <FaBox className="mt-2 h-4 w-4 mr-0.5" />}
                <div className="flex flex-wrap gap-0.5 w-full">
                    <ShipSelect
                        shipLocation={values?.['shipLocation'] ?? 'usonly'}
                        shipAreas={values?.['shipAreas']?.split(',')}
                        setValue={setValue}
                    />
                </div>
            </div>;
    }
};

type CurrencyAndPriceProps = {
    values: MarketValues;
    setValue: SetFormValue;
    preferences: MarketPreferences;
    /** the "More Fields" copy edits the saved defaults, so it is enabled only where a default exists */
    isDefaults: boolean;
};

const CurrencyAndPrice = (props: CurrencyAndPriceProps) => {
    const { values, setValue, preferences, isDefaults } = props;

    return <div className="flex gap-0.5">
        <CurrencySelect currency={values?.['currency'] ?? 'USD'}
                        setValue={setValue}
                        label={isDefaults ? 'Default Currency' : 'Price Currency'}
                        disabled={isDefaults ? !preferences['currency'] : !!preferences['currency']}
        />
        <PriceInput price={values?.['price'] ?? ''}
                    setValue={setValue}
                    disabled={isDefaults ? !preferences['price'] : !!preferences['price']}
        />
    </div>;
};

export const AddToMarketForm = ({ formValues, setFormValues }: ModeSettingFormProps) => {
    const { settings: { marketPreferences = {} } } = useSettings();
    const preferences = marketPreferences as MarketPreferences;

    const hasPreferences = Object.keys(preferences).length > 0;

    const values: MarketValues = Object.assign({},
        preferences,
        formValues,
    );

    const setValue = (field: string, value: string) => {
        setFormValues(Object.assign(values, { [field]: value }));
    };

    const visible = getVisibleMarketFields(preferences, values);
    const fieldProps = { values, setValue };

    return <form name="sell" className="flex flex-wrap gap-1 pb-2 pr-1.5 pt-1 max-w-md">
        <CurrencyAndPrice {...fieldProps} preferences={preferences} isDefaults={false} />
        {MarketFieldNames.filter(field => visible[field]).map(field =>
            <MarketField key={field} field={field} showIcon={true} {...fieldProps} />,
        )}
        {hasPreferences ? <div className="collapse collapse-arrow collapse-xs text-xs">
            <input type="checkbox" aria-label="More Fields" />
            <div className="collapse-title p-1.5 m-0">More Fields</div>
            <div className="collapse-content flex flex-wrap gap-1 pr-1 pl-1">
                <CurrencyAndPrice {...fieldProps} preferences={preferences} isDefaults={true} />
                {MarketFieldNames.filter(field => !visible[field]).map(field =>
                    <MarketField key={field} field={field} showIcon={false} {...fieldProps} />,
                )}
            </div>
        </div> : <div className="text-xs italic">
            Change Defaults in Settings
        </div>}
    </form>;
};

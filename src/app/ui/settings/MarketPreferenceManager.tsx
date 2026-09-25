import { useExtension } from '@/app/lib/extension/useExtension';
import { useSettings } from '@/app/lib/SettingsProvider';
import { MarketPreferences } from '@/app/lib/types/market';
import { ConditionSelect } from '@/app/ui/forms/ConditionSelect';
import { CountrySelect } from '@/app/ui/forms/CountrySelect';
import { CurrencySelect } from '@/app/ui/forms/CurrencySelect';
import { NotesTextArea } from '@/app/ui/forms/NotesTextArea';
import { PaymentMethodSelect } from '@/app/ui/forms/PaymentMethodSelect';
import { PriceInput } from '@/app/ui/forms/PriceInput';
import { ShipSelect } from '@/app/ui/forms/ShipSelect';
import React, { useId } from 'react';

export const MarketPreferenceManager = () => {
    const { syncOn } = useExtension();
    const fieldId = useId();
    const { settings, setSetting } = useSettings();
    const { marketPreferences = {} } = settings;
    const preferences = marketPreferences as MarketPreferences;

    const setValue = async (field: string, value: string) => {
        await setSetting('marketPreferences', Object.assign(
            preferences,
            { [field]: value }
        ));
    };

    return syncOn &&
    <div className="collapse collapse-arrow bg-base-100 border-1 border-base-300 text-sm">
        <input type="radio" name="settings" aria-labelledby="settings-market-defaults" />
        <h3 className="collapse-title font-semibold" id="settings-market-defaults">Market Defaults</h3>
        <div className="collapse-content text-xs">
            <form name="sell" className="flex flex-wrap gap-1 pb-2 pr-1.5">
                <label htmlFor={`${fieldId}-currency`} className="pl-0.5">Currency &amp; Price</label>
                <div className="flex gap-0.5">
                    <CurrencySelect id={`${fieldId}-currency`}
                                    currency={preferences?.['currency'] ?? ''}
                                    setValue={setValue}
                                    label="Currency"
                    />
                    <PriceInput price={preferences?.['price'] ?? ''} setValue={setValue} />
                </div>

                <label htmlFor={`${fieldId}-condition`} className="pl-0.5">Condition</label>
                <ConditionSelect id={`${fieldId}-condition`}
                                 condition={preferences?.['condition'] ?? ''}
                                 setValue={setValue}
                />

                <label htmlFor={`${fieldId}-notes`} className="pl-0.5">Notes</label>
                <NotesTextArea id={`${fieldId}-notes`} notes={preferences?.['notes'] ?? ''} setValue={setValue} />

                <label htmlFor={`${fieldId}-payment`} className="pl-0.5">Payment Methods</label>
                <PaymentMethodSelect
                    id={`${fieldId}-payment`}
                    paymentMethod={preferences?.['paymentMethod']?.split(',') ?? ['']}
                    setValue={setValue} />

                <label htmlFor={`${fieldId}-country`} className="pl-0.5">Item Location</label>
                <CountrySelect id={`${fieldId}-country`}
                               country={preferences?.['country'] ?? ''}
                               setValue={setValue}
                />

                <label htmlFor={`${fieldId}-ships`} className="pl-0.5">Ships To</label>
                <ShipSelect id={`${fieldId}-ships`}
                            shipLocation={preferences?.['shipLocation'] ?? ''}
                            shipAreas={preferences?.['shipAreas']?.split(',')}
                            setValue={setValue}
                />
            </form>
            <button className="btn btn-error" onClick={() => {
                void setSetting('marketPreferences', {});
            }}>
                Clear Market Defaults
            </button>
        </div>
    </div>;
};

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
import React from 'react';

export const MarketPreferenceManager = () => {
    const { syncOn } = useExtension();
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
        <input type="radio" name="settings" />
        <h3 className="collapse-title font-semibold">Market Defaults</h3>
        <div className="collapse-content text-xs">
            <form name="sell" className="flex flex-wrap gap-1 pb-2 pr-1.5">
                <label className="pl-0.5">Currency &amp; Price</label>
                <div className="flex gap-0.5">
                    <CurrencySelect currency={preferences?.['currency'] ?? ''}
                                    setValue={setValue}
                    />
                    <PriceInput price={preferences?.['price'] ?? ''} setValue={setValue} />
                </div>

                <label className="pl-0.5">Condition</label>
                <ConditionSelect condition={preferences?.['condition'] ?? ''}
                                 setValue={setValue}
                />

                <label className="pl-0.5">Notes</label>
                <NotesTextArea notes={preferences?.['notes'] ?? ''} setValue={setValue} />

                <label className="pl-0.5">Payment Methods</label>
                <PaymentMethodSelect
                    paymentMethod={preferences?.['paymentMethod']?.split(',') ?? ['']}
                    setValue={setValue} />

                <label className="pl-0.5">Item Location</label>
                <CountrySelect country={preferences?.['country'] ?? ''}
                               setValue={setValue}
                />

                <label className="pl-0.5">Ships To</label>
                <ShipSelect shipLocation={preferences?.['shipLocation'] ?? ''}
                            shipAreas={preferences?.['shipAreas']?.split(',')}
                            setValue={setValue}
                />
            </form>
            <button className="btn btn-error" onClick={async () => {
                await setSetting('marketPreferences', {});
            }}>
                Clear Market Defaults
            </button>
        </div>
    </div>;
};

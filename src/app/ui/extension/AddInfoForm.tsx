import { ModeSettingFormProps } from '@/app/lib/extension/types';
import { CurrencySelect } from '@/app/ui/forms/CurrencySelect';
import { DateSelect } from '@/app/ui/forms/DateSelect';
import { PriceInput } from '@/app/ui/forms/PriceInput';
import { TextInput } from '@/app/ui/forms/TextInput';
import React from 'react';
import { FaCheckDouble, FaCheckToSlot } from 'react-icons/fa6';

const PrivateComment = ({ formValues, setFormValues }: ModeSettingFormProps) => {
    return <textarea
           name="privatecomment"
           className="textarea textarea-md text-sm p-2"
           placeholder="Private Comment"
           defaultValue={formValues?.['privatecomment']}
           onChange={event => setFormValues(
               Object.assign(formValues, { privatecomment: event.currentTarget.value })
           )}
    />
};

export const AddInfoForm = ({ formValues, setFormValues }: ModeSettingFormProps) => {
    const setValue = (field: string, value: string) => {
        setFormValues(Object.assign(formValues, { [field]: value }));
    };

    return <form name="info">
        <PrivateComment formValues={formValues} setFormValues={setFormValues} />
        <div className="flex gap-0.5">
            <CurrencySelect currency={formValues?.['pp_currency'] ?? 'USD'}
                            setValue={setValue}
                            field="pp_currency"
            />
            <PriceInput price={formValues?.['pricepaid'] ?? ''}
                        setValue={setValue}
                        field="pricepaid"
                        label="Paid"
            />
        </div>
        <div className="flex gap-0.5">
            <CurrencySelect currency={formValues?.['cv_currency'] ?? 'USD'}
                            setValue={setValue}
            />
            <PriceInput price={formValues?.['currvalue'] ?? ''}
                        setValue={setValue}
                        field="currvalue"
                        label="Value"
            />
        </div>
        <div className="flex gap-0.5 m-0.5">
            <FaCheckToSlot className="h-8 w-8 mr-0.5" />
            <DateSelect date={formValues?.['acquisitiondate']} setValue={setValue}
                        field="acquisitiondate"
            />
            <TextInput text={formValues?.['acquiredfrom']} setValue={setValue}
                       field="acquiredfrom"
                       label="Acq. Note"
           />
        </div>
        <div className="flex gap-0.5 m-0.5">
            <FaCheckDouble className="h-8 w-8 mr-0.5" />
            <DateSelect date={formValues?.['invdate']} setValue={setValue}
                        field="invdate"
            />
            <TextInput text={formValues?.['invlocation']} setValue={setValue}
                       field="invlocation"
                       label="Inv. Note"
            />
        </div>
    </form>
};

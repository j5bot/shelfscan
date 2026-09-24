import { ModeSettingFormProps } from '@/app/lib/extension/types';
import { CurrencySelect } from '@/app/ui/forms/CurrencySelect';
import { DateSelect } from '@/app/ui/forms/DateSelect';
import { PriceInput } from '@/app/ui/forms/PriceInput';
import { StatusSelect } from '@/app/ui/forms/StatusSelect';
import { TextInput } from '@/app/ui/forms/TextInput';
import React from 'react';
import { FaCheckDouble, FaCheckToSlot } from 'react-icons/fa6';

const PrivateComment = ({ formValues, setFormValues }: ModeSettingFormProps) => {
    return <textarea
           name="privatecomment"
           className="textarea textarea-md text-sm p-2"
           placeholder="Private Comment"
           defaultValue={formValues?.['privatecomment']}
           onChange={event => {
               const privatecomment = event.currentTarget.value;
               setFormValues(prev => ({ ...prev, privatecomment }));
           }}
    />
};

export const AddInfoForm = ({ formValues, setFormValues }: ModeSettingFormProps) => {
    const setValue = (field: string, value: string) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    return <form name="info" className="pt-1">
        <PrivateComment formValues={formValues} setFormValues={setFormValues} />
        <StatusSelect setValue={setValue} statuses={formValues?.['statuses']?.split(',') ?? []} />
        <div className="flex gap-0.5 mt-0.5">
            <TextInput text={formValues?.['tradecondition']}
                       setValue={setValue}
                       field="tradecondition"
                       label="Trade Condition" />
        </div>
        <div className="flex gap-0.5 mt-0.5">
            <CurrencySelect currency={formValues?.['pp_currency'] ?? 'USD'}
                            setValue={setValue}
                            field="pp_currency"
                            label="Paid Currency"
            />
            <PriceInput price={formValues?.['pricepaid'] ?? ''}
                        setValue={setValue}
                        field="pricepaid"
                        label="Paid"
            />
        </div>
        <div className="flex gap-0.5 mt-0.5">
            <CurrencySelect currency={formValues?.['cv_currency'] ?? 'USD'}
                            setValue={setValue}
                            field="cv_currency"
                            label="Value Currency"
            />
            <PriceInput price={formValues?.['currvalue'] ?? ''}
                        setValue={setValue}
                        field="currvalue"
                        label="Value"
            />
        </div>
        <div className="flex gap-0.5 m-0.5">
            <FaCheckToSlot className="h-7 w-7 mr-0.5" />
            <DateSelect date={formValues?.['acquisitiondate']} setValue={setValue}
                        field="acquisitiondate"
            />
            <TextInput text={formValues?.['acquiredfrom']} setValue={setValue}
                       field="acquiredfrom"
                       label="Acq. Note" />
        </div>
        <div className="flex gap-0.5 m-0.5 mt-0">
            <FaCheckDouble className="h-7 w-7 mr-0.5" />
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

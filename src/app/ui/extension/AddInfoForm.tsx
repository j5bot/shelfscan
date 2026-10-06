import { ModeSettingFormProps } from '@/app/lib/extension/types';
import { InfoFormFields } from '@/app/lib/utils/collectionInfo';
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
           placeholder={InfoFormFields.privatecomment.label}
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
                       label={InfoFormFields.tradecondition.label} />
        </div>
        <div className="flex gap-0.5 mt-0.5">
            <CurrencySelect currency={formValues?.['pp_currency'] ?? 'USD'}
                            setValue={setValue}
                            field="pp_currency"
                            label={InfoFormFields.pp_currency.label}
            />
            <PriceInput price={formValues?.['pricepaid'] ?? ''}
                        setValue={setValue}
                        field="pricepaid"
                        label={InfoFormFields.pricepaid.label}
            />
        </div>
        <div className="flex gap-0.5 mt-0.5">
            <CurrencySelect currency={formValues?.['cv_currency'] ?? 'USD'}
                            setValue={setValue}
                            field="cv_currency"
                            label={InfoFormFields.cv_currency.label}
            />
            <PriceInput price={formValues?.['currvalue'] ?? ''}
                        setValue={setValue}
                        field="currvalue"
                        label={InfoFormFields.currvalue.label}
            />
        </div>
        <div className="flex gap-0.5 m-0.5">
            <FaCheckToSlot className="h-7 w-7 mr-0.5" />
            <DateSelect date={formValues?.['acquisitiondate']} setValue={setValue}
                        field="acquisitiondate"
                        label={InfoFormFields.acquisitiondate.label}
            />
            <TextInput text={formValues?.['acquiredfrom']} setValue={setValue}
                       field="acquiredfrom"
                       label={InfoFormFields.acquiredfrom.label} />
        </div>
        <div className="flex gap-0.5 m-0.5 mt-0">
            <FaCheckDouble className="h-7 w-7 mr-0.5" />
            <DateSelect date={formValues?.['invdate']} setValue={setValue}
                        field="invdate"
                        label={InfoFormFields.invdate.label}
            />
            <TextInput text={formValues?.['invlocation']} setValue={setValue}
                       field="invlocation"
                       label={InfoFormFields.invlocation.label}
            />
        </div>
    </form>
};

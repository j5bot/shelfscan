import { describe, it, expect } from '../setup';
import {
    INFO_FORM_FIELD_NAMES,
    infoUpdatesToFormValues,
    mergeInfoFormValues,
    readLoadedInfo,
} from '@/app/lib/utils/collectionInfo';

describe('INFO_FORM_FIELD_NAMES', () => {
    it('lists the info form fields in form order', () => {
        expect(INFO_FORM_FIELD_NAMES).toEqual([
            'privatecomment', 'statuses', 'tradecondition', 'pp_currency', 'pricepaid',
            'cv_currency', 'currvalue', 'acquisitiondate', 'acquiredfrom', 'invdate', 'invlocation',
        ]);
    });
});

describe('readLoadedInfo', () => {
    it('reads plain fields, text fields and statuses from a BGG collection item', () => {
        expect(readLoadedInfo({
            objectid: '342942',
            pricepaid: 54.5,
            pp_currency: 'USD',
            acquisitiondate: '2024-01-05',
            currvalue: '',
            invlocation: null,
            status: { own: true, fortrade: true, wishlist: false },
            textfield: { privatecomment: { value: 'Gift' }, conditiontext: { value: 'Like new' } },
        })).toEqual({
            pricepaid: '54.5',
            pp_currency: 'USD',
            acquisitiondate: '2024-01-05',
            privatecomment: 'Gift',
            tradecondition: 'Like new',
            statuses: 'own,fortrade',
        });
    });

    it('is empty without an item', () => {
        expect(readLoadedInfo(undefined)).toEqual({});
    });
});

describe('infoUpdatesToFormValues', () => {
    it('joins statuses, stringifies numbers and drops undefined fields', () => {
        expect(infoUpdatesToFormValues({ statuses: ['own', 'fortrade'], pricepaid: 20, invdate: undefined }))
            .toEqual({ statuses: 'own,fortrade', pricepaid: '20' });
    });
});

describe('mergeInfoFormValues', () => {
    it('keeps loaded fields and puts the updates on top', () => {
        const loaded = { privatecomment: 'Gift', pricepaid: '54.5', statuses: 'own' };
        expect(mergeInfoFormValues(loaded, { pricepaid: '', invlocation: 'Shelf 2' }))
            .toEqual({ privatecomment: 'Gift', pricepaid: '', statuses: 'own', invlocation: 'Shelf 2' });
    });
});

import { describe, it, expect } from '../setup';
import {
    resolveCollectionFormValues,
    statusesToFormValue,
} from '@/app/lib/utils/collectionFormValues';

describe('statusesToFormValue', () => {
    it('lists the true statuses in order', () => {
        expect(statusesToFormValue({ own: true, prevowned: false, fortrade: true })).toBe('own,fortrade');
    });

    it('is empty without statuses', () => {
        expect(statusesToFormValue(undefined)).toBe('');
        expect(statusesToFormValue({ own: false })).toBe('');
    });
});

describe('resolveCollectionFormValues', () => {
    const current = { tradecondition: 'Like new', statuses: 'own' };

    it('takes the collection fields when the values were never set against them', () => {
        expect(resolveCollectionFormValues({ values: { pricepaid: '10' } }, current))
            .toEqual({ pricepaid: '10', tradecondition: 'Like new', statuses: 'own' });
    });

    it('keeps user edits made against the current collection fields', () => {
        const state = {
            values: { tradecondition: 'Worn', statuses: 'own,fortrade' },
            against: current,
        };
        expect(resolveCollectionFormValues(state, current))
            .toEqual({ tradecondition: 'Worn', statuses: 'own,fortrade' });
    });

    it('replaces only the collection fields the item has since changed', () => {
        const state = {
            values: { tradecondition: 'Worn', statuses: 'own,fortrade' },
            against: current,
        };
        expect(resolveCollectionFormValues(state, { ...current, statuses: 'own,wishlist' }))
            .toEqual({ tradecondition: 'Worn', statuses: 'own,wishlist' });
    });
});

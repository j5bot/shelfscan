import { describe, it, expect } from '../setup.js';
import {
    buildContactSubject,
    buildContactText,
    CONTACT_HONEYPOT_FIELD,
    CONTACT_LIMITS,
    isHoneypotFilled,
    readContactFields,
    validateContactFields,
} from '@/app/lib/utils/contact';

const validFields = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Feature idea',
    message: 'It would be great to scan multiple barcodes at once.',
};

describe('contact utils', () => {
    describe('#readContactFields', () => {
        it('reads string fields and defaults missing ones to empty strings', () => {
            const formData = new FormData();
            formData.set('name', 'Ada');
            formData.set('email', 'ada@example.com');

            expect(readContactFields(formData)).toEqual({
                name: 'Ada',
                email: 'ada@example.com',
                subject: '',
                message: '',
            });
        });
    });

    describe('#isHoneypotFilled', () => {
        it('is false when the honeypot is empty or missing', () => {
            const formData = new FormData();
            expect(isHoneypotFilled(formData)).toBe(false);
            formData.set(CONTACT_HONEYPOT_FIELD, '  ');
            expect(isHoneypotFilled(formData)).toBe(false);
        });

        it('is true when the honeypot has a value', () => {
            const formData = new FormData();
            formData.set(CONTACT_HONEYPOT_FIELD, 'http://spam.example');
            expect(isHoneypotFilled(formData)).toBe(true);
        });
    });

    describe('#validateContactFields', () => {
        it('accepts valid fields and trims them', () => {
            const result = validateContactFields({ ...validFields, name: '  Ada Lovelace  ' });
            expect(result).toEqual({ ok: true, data: validFields });
        });

        it('allows an empty subject', () => {
            const result = validateContactFields({ ...validFields, subject: '' });
            expect(result.ok).toBe(true);
        });

        it('reports an error per invalid field', () => {
            const result = validateContactFields({
                name: ' ',
                email: 'not-an-email',
                subject: '',
                message: 'short',
            });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(Object.keys(result.fieldErrors).sort()).toEqual(['email', 'message', 'name']);
            }
        });

        it('rejects messages over the length limit', () => {
            const result = validateContactFields({
                ...validFields,
                message: 'x'.repeat(CONTACT_LIMITS.message + 1),
            });
            expect(result.ok).toBe(false);
        });
    });

    describe('#buildContactSubject', () => {
        it('prefixes the subject and strips line breaks', () => {
            const subject = buildContactSubject({ ...validFields, subject: 'Hello\r\nBcc: x@example.com' });
            expect(subject).toBe('[ShelfScan Contact] Hello Bcc: x@example.com — Ada Lovelace');
        });

        it('falls back when there is no subject', () => {
            expect(buildContactSubject({ ...validFields, subject: '' }))
                .toBe('[ShelfScan Contact] New message — Ada Lovelace');
        });
    });

    describe('#buildContactText', () => {
        it('includes the sender details and message', () => {
            const text = buildContactText(validFields);
            expect(text).toContain('Name: Ada Lovelace');
            expect(text).toContain('Email: ada@example.com');
            expect(text.endsWith(validFields.message)).toBe(true);
        });
    });
});

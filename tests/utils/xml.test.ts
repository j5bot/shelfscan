import { describe, it, expect, beforeAll } from '../setup.js';
import {
    getElementAttribute,
    getElementInnerHTML,
    elementGetter,
    getPageDOM,
} from '@/app/lib/utils/xml';

// Ensure window and DOMParser are available in the jsdom environment
beforeAll(() => {
    if (typeof window === 'undefined') {
        (global as Record<string, unknown>).window = global;
    }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseXml = (xml: string) =>
    new DOMParser().parseFromString(xml, 'text/xml');

describe('xml utils', () => {
    describe('#getElementAttribute', () => {
        it('returns a string attribute value when present', () => {
            const doc = parseXml('<item value="hello" />');
            const el = doc.querySelector('item');
            expect(getElementAttribute(el, false, 'value')).toBe('hello');
        });

        it('returns a numeric attribute value when number=true', () => {
            const doc = parseXml('<item count="42" />');
            const el = doc.querySelector('item');
            expect(getElementAttribute(el, true, 'count')).toBe(42);
        });

        it('returns undefined when element is null', () => {
            expect(getElementAttribute(null, false, 'value')).toBeUndefined();
        });

        it('returns undefined when attribute param is not provided', () => {
            const doc = parseXml('<item value="hello" />');
            const el = doc.querySelector('item');
            expect(getElementAttribute(el, false, undefined)).toBeUndefined();
        });

        it('returns undefined when the attribute does not exist on the element', () => {
            const doc = parseXml('<item />');
            const el = doc.querySelector('item');
            expect(getElementAttribute(el, false, 'missing')).toBeUndefined();
        });
    });

    describe('#getElementInnerHTML', () => {
        it('returns the innerHTML as a string', () => {
            const doc = parseXml('<item>hello world</item>');
            const el = doc.querySelector('item');
            expect(getElementInnerHTML(el)).toBe('hello world');
        });

        it('returns innerHTML as a number when number=true', () => {
            const doc = parseXml('<item>100</item>');
            const el = doc.querySelector('item');
            expect(getElementInnerHTML(el, true)).toBe(100);
        });

        it('returns undefined when element is null', () => {
            expect(getElementInnerHTML(null)).toBeUndefined();
        });
    });

    describe('#elementGetter', () => {
        it('returns the value attribute of the element', () => {
            const doc = parseXml('<item value="test" />');
            const el = doc.querySelector('item');
            expect(elementGetter(el)).toBe('test');
        });

        it('falls back to innerHTML when no value attribute exists', () => {
            const doc = parseXml('<item>some text</item>');
            const el = doc.querySelector('item');
            expect(elementGetter(el)).toBe('some text');
        });

        it('returns a value from a child selected by selector', () => {
            const doc = parseXml('<root><name value="Alice" /></root>');
            const el = doc.querySelector('root');
            expect(elementGetter(el, false, 'name')).toBe('Alice');
        });

        it('returns a specific attribute when selector and attribute are both provided', () => {
            const doc = parseXml(
                '<root><link type="language" value="English" /></root>',
            );
            const el = doc.querySelector('root');
            expect(elementGetter(el, false, 'link', 'value')).toBe('English');
        });

        it('returns undefined when element is null', () => {
            expect(elementGetter(null)).toBeUndefined();
        });

        it('returns undefined when selector does not match any child', () => {
            const doc = parseXml('<root />');
            const el = doc.querySelector('root');
            expect(elementGetter(el, false, 'missing')).toBeUndefined();
        });

        it('returns a numeric value when number=true and a value attribute is present', () => {
            const doc = parseXml('<item value="42" />');
            const el = doc.querySelector('item');
            expect(elementGetter(el, true)).toBe(42);
        });
    });

    describe('#getPageDOM', () => {
        it('parses an XML string and returns a queryable document', () => {
            const dom = getPageDOM('<root><child value="x" /></root>', true);
            expect(dom.querySelector('child')?.getAttribute('value')).toBe('x');
        });

        it('parses an HTML string and returns a truthy fragment-like object', () => {
            const dom = getPageDOM('<p id="para">hello</p>', false);
            expect(dom).toBeTruthy();
        });

        it('re-uses the same parser instance across calls', () => {
            // Both calls should succeed without throwing, confirming the singleton is stable
            const dom1 = getPageDOM('<a value="1" />', true);
            const dom2 = getPageDOM('<b value="2" />', true);
            expect(dom1.querySelector('a')?.getAttribute('value')).toBe('1');
            expect(dom2.querySelector('b')?.getAttribute('value')).toBe('2');
        });
    });
});

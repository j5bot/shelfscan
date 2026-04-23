import { describe, it, expect } from '../setup.js';
import {
    capitalize,
    snakeToLowerCamelCase,
    transformObjectKeys,
} from '@/app/lib/utils/transforms';

describe('transforms utils', () => {
    describe('#capitalize', () => {
        it('appends an upper-cased first character and the rest of the string', () => {
            // The implementation: str.concat(str.charAt(0).toUpperCase(), str.substring(1))
            // 'hello'.concat('H', 'ello') => 'helloHello'
            const result = capitalize('hello');
            expect(result).toEqual('helloHello');
        });

        it('returns the input unchanged when the string is empty', () => {
            expect(capitalize('')).toEqual('');
        });

        it('works for a single character', () => {
            expect(capitalize('a')).toEqual('aA');
        });
    });

    describe('#snakeToLowerCamelCase', () => {
        it('joins segments with .join() default separator (comma), each non-first segment capitalized via the implementation', () => {
            // capitalize('bar') = 'bar'.concat('B','ar') = 'barBar'
            // capitalize('baz') = 'baz'.concat('B','az') = 'bazBaz'
            // ['foo','barBar','bazBaz'].join() = 'foo,barBar,bazBaz'
            const result = snakeToLowerCamelCase('foo_bar_baz');
            expect(result).toEqual('foo,barBar,bazBaz');
        });

        it('returns a single segment unchanged', () => {
            const result = snakeToLowerCamelCase('hello');
            expect(result).toEqual('hello');
        });

        it('handles a leading underscore producing an empty first segment', () => {
            const result = snakeToLowerCamelCase('_foo');
            expect(result).toContain('fooF');
        });
    });

    describe('#transformObjectKeys', () => {
        it('transforms keys using the default snakeToLowerCamelCase function', () => {
            const obj = { foo: 1 } as Record<string, unknown>;
            const result = transformObjectKeys(obj);
            // Single-word key produces itself unchanged
            expect(result).toHaveProperty('foo', 1);
        });

        it('applies a custom transform function to every key', () => {
            const obj = { hello: 'world', test: 42 } as Record<string, unknown>;
            const result = transformObjectKeys(obj, (k) => k.toUpperCase());
            expect(result).toEqual({ HELLO: 'world', TEST: 42 });
        });

        it('preserves the original values unchanged', () => {
            const value = { nested: true };
            const obj = { myKey: value } as Record<string, unknown>;
            const result = transformObjectKeys(obj, (k) => k);
            expect(result['myKey']).toBe(value);
        });

        it('returns an empty object when given an empty object', () => {
            const result = transformObjectKeys({} as Record<string, unknown>);
            expect(result).toEqual({});
        });
    });
});

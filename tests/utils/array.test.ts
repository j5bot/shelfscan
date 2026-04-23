import { describe, it, expect } from '../setup.js';
import {
    removeFromArray,
    removeAndDeletePropertyIfArrayEmpty,
    conditionalAddToArray,
} from '@/app/lib/utils/array';

describe('array utils', () => {
    describe('#removeFromArray', () => {
        it('removes a matching element from the array', () => {
            // Arrange
            const arr = [1, 2, 3, 4];

            // Act
            const result = removeFromArray(2, arr);

            // Assert
            expect(result).toEqual([1, 3, 4]);
        });

        it('returns original array when element is not present', () => {
            const arr = [1, 2, 3];
            const result = removeFromArray(99, arr);
            expect(result).toEqual([1, 2, 3]);
        });

        it('removes all occurrences of duplicates', () => {
            const arr = [1, 2, 2, 3];
            const result = removeFromArray(2, arr);
            expect(result).toEqual([1, 3]);
        });

        it('returns an empty array when array is empty', () => {
            const result = removeFromArray(1, []);
            expect(result).toEqual([]);
        });

        it('defaults to an empty array when no array is provided', () => {
            const result = removeFromArray(1);
            expect(result).toEqual([]);
        });

        it('works with string elements', () => {
            const arr = ['a', 'b', 'c'];
            const result = removeFromArray('b', arr);
            expect(result).toEqual(['a', 'c']);
        });
    });

    describe('#removeAndDeletePropertyIfArrayEmpty', () => {
        it('removes the id from the array and keeps the property when array is non-empty', () => {
            // Arrange
            const obj: Record<string, number[]> = { key: [1, 2, 3] };

            // Act
            removeAndDeletePropertyIfArrayEmpty(1, obj, 'key');

            // Assert
            expect(obj['key']).toEqual([2, 3]);
        });

        it('deletes the property entirely when the array becomes empty', () => {
            const obj: Record<string, number[]> = { key: [1] };
            removeAndDeletePropertyIfArrayEmpty(1, obj, 'key');
            expect(obj).not.toHaveProperty('key');
        });

        it('is a no-op when the id is not in the array', () => {
            const obj: Record<string, number[]> = { key: [2, 3] };
            removeAndDeletePropertyIfArrayEmpty(99, obj, 'key');
            expect(obj['key']).toEqual([2, 3]);
        });

        it('works with numeric property keys', () => {
            const obj: Record<number, number[]> = { 42: [10, 20] };
            removeAndDeletePropertyIfArrayEmpty(10, obj, 42);
            expect(obj[42]).toEqual([20]);
        });
    });

    describe('#conditionalAddToArray', () => {
        it('adds the element when it is not already present', () => {
            // Arrange
            const arr = [1, 2, 3];

            // Act
            const result = conditionalAddToArray(4, arr);

            // Assert
            expect(result).toEqual([1, 2, 3, 4]);
        });

        it('does not add the element when it is already present', () => {
            const arr = [1, 2, 3];
            const result = conditionalAddToArray(2, arr);
            expect(result).toEqual([1, 2, 3]);
        });

        it('defaults to an empty array and adds the element', () => {
            const result = conditionalAddToArray(5);
            expect(result).toEqual([5]);
        });

        it('mutates and returns the same array reference', () => {
            const arr = [1, 2];
            const result = conditionalAddToArray(3, arr);
            expect(result).toBe(arr);
        });

        it('works with string elements', () => {
            const arr = ['a', 'b'];
            const result = conditionalAddToArray('c', arr);
            expect(result).toEqual(['a', 'b', 'c']);
        });
    });
});

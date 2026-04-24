import { describe, it, expect } from '../setup.js';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';

describe('image utils', () => {
    describe('#getImageSizeFromUrl', () => {
        it('parses width and height from a fit-in URL', () => {
            // Arrange
            const url = 'https://cdn.example.com/fit-in/300x400/image.jpg';

            // Act
            const result = getImageSizeFromUrl(url);

            // Assert
            expect(result).toEqual({ width: 300, height: 400 });
        });

        it('returns the default 200x200 when the URL contains no fit-in segment', () => {
            const url = 'https://cdn.example.com/image.jpg';
            const result = getImageSizeFromUrl(url);
            expect(result).toEqual({ width: 200, height: 200 });
        });

        it('returns the default 200x200 for an empty string', () => {
            const result = getImageSizeFromUrl('');
            expect(result).toEqual({ width: 200, height: 200 });
        });

        it('correctly maps the first capture group to width', () => {
            const url = 'https://cdn.example.com/fit-in/640x480/image.png';
            const result = getImageSizeFromUrl(url);
            expect(result.width).toEqual(640);
            expect(result.height).toEqual(480);
        });

        it('handles square dimensions', () => {
            const url = 'https://cdn.example.com/fit-in/150x150/thumb.jpg';
            const result = getImageSizeFromUrl(url);
            expect(result).toEqual({ width: 150, height: 150 });
        });
    });
});

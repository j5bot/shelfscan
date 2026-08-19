import { describe, it, expect } from '../setup.js';
import { conditionParser } from '@/app/lib/utils/condition';

describe('conditionParser', () => {
    describe('New', () => {
        it('matches the NIS abbreviation', () => {
            expect(conditionParser('NIS $25 shipped')).toBe('New');
        });

        it('matches full sealed/shrinkwrap phrasing', () => {
            expect(conditionParser('Brand new, still sealed in shrinkwrap')).toBe('New');
        });

        it('matches a real geeklist Condition: label snippet', () => {
            expect(conditionParser('Condition: New (NIS)')).toBe('New');
        });

        it('matches "Brand new in shrinkwrap" without a space before "wrap"', () => {
            expect(conditionParser('[b]Condition:[/b] Brand new in shrinkwrap.')).toBe('New');
        });
    });

    describe('Like New', () => {
        it('matches the LN abbreviation', () => {
            expect(conditionParser('LN, never played')).toBe('Like New');
        });

        it('matches "opened but unplayed, no marks"', () => {
            expect(conditionParser('Opened but unplayed, no marks')).toBe('Like New');
        });

        it('matches a real geeklist Condition: label snippet', () => {
            expect(conditionParser('Condition: Like new.  Never played and unpunched.')).toBe('Like New');
        });

        it('prefers the explicit "Like New" phrase over a co-occurring New-tier word', () => {
            // Real sample listing: the box being unopened/not-shrinkwrapped is a
            // detail, not a contradiction of the stated "Like New" grade.
            expect(
                conditionParser(
                    '[b]Condition:[/b] Like New, unopened in box, not shrinkwrapped',
                ),
            ).toBe('Like New');
        });
    });

    describe('Very Good', () => {
        it('matches the VG abbreviation', () => {
            expect(conditionParser('Condition: VG, minimal shelf wear')).toBe('Very Good');
        });

        it('matches "very good"', () => {
            expect(conditionParser('Very good condition, minor overall wear')).toBe('Very Good');
        });

        it('matches a real geeklist Condition: label snippet', () => {
            expect(
                conditionParser('Very good condition.  Minor shelfwear, components excellent.'),
            ).toBe('Very Good');
        });
    });

    describe('Good', () => {
        it('matches the G abbreviation', () => {
            expect(conditionParser('(G) Pandemic, some sleeve wear')).toBe('Good');
        });

        it('matches "good condition"', () => {
            expect(conditionParser('Good condition, complete')).toBe('Good');
        });

        it('matches a real geeklist Condition: label snippet', () => {
            expect(conditionParser('Condition: Good')).toBe('Good');
        });
    });

    describe('Acceptable', () => {
        it('matches the Fair synonym', () => {
            expect(conditionParser('Box condition: Fair. Intact but shows wear.')).toBe('Acceptable');
        });

        it('matches "heavy wear"', () => {
            expect(conditionParser('Heavy wear, well worn but all pieces present')).toBe('Acceptable');
        });

        it('matches a real geeklist Condition: label snippet', () => {
            expect(conditionParser('Condition: Acceptable to Good.')).toBe('Acceptable');
        });
    });

    describe('mint tie-break', () => {
        it('resolves to New when mint co-occurs with sealed/shrink language', () => {
            expect(conditionParser('Mint, still sealed in shrink')).toBe('New');
        });

        it('resolves to Like New for bare mint', () => {
            expect(conditionParser('Mint condition, played once')).toBe('Like New');
        });

        it('is case-insensitive', () => {
            expect(conditionParser('MINT')).toBe('Like New');
            expect(conditionParser('Mint')).toBe('Like New');
            expect(conditionParser('mint')).toBe('Like New');
        });
    });

    describe('excellent / great condition', () => {
        it('resolves to Like New when paired with an unplayed signal', () => {
            expect(conditionParser('Condition: Excellent (unplayed)')).toBe('Like New');
        });

        it('resolves to Very Good when paired with played-but-fine language', () => {
            expect(conditionParser('Condition: Excellent, played twice')).toBe('Very Good');
        });

        it('treats "great condition" the same as "excellent"', () => {
            expect(conditionParser('Great condition, played a couple times')).toBe('Very Good');
        });
    });

    describe('headline priority', () => {
        it('prefers the leading explicit tier name over a later higher-tier keyword', () => {
            // Real sample listing: headline is Acceptable even though the
            // per-component detail says "excellent".
            expect(
                conditionParser(
                    'Acceptable condition.  Moderate shelfwear, components excellent.',
                ),
            ).toBe('Acceptable');
        });

        it('ignores unrelated wear-shaped words before the Condition: label', () => {
            expect(
                conditionParser('This edition has a well-worn theme. Condition: New (NIS)'),
            ).toBe('New');
        });

        it('ignores unrelated wear-shaped words after the labeled segment', () => {
            expect(
                conditionParser('Condition: New (NIS). This is a well-worn western theme game.'),
            ).toBe('New');
        });
    });

    describe('box vs. components/contents precedence', () => {
        it('uses the components rating over a differing box rating', () => {
            expect(
                conditionParser('Cards and rules in Excellent condition. Box in Acceptable condition.'),
            ).toBe('Very Good');
        });

        it('uses the components rating in the itemized "Box = X, Components = Y" form', () => {
            expect(
                conditionParser('[b]Condition:[/b] Box = Acceptable, Components = Good'),
            ).toBe('Good');
        });

        it('falls back to the box rating when it is the only rating given', () => {
            expect(conditionParser('Box: Acceptable. Some shelf wear on the corners.')).toBe('Acceptable');
        });
    });

    describe('ranges and grade modifiers', () => {
        it('resolves "VG to LN" to the lower/worse tier', () => {
            expect(conditionParser('VG to LN')).toBe('Very Good');
        });

        it('resolves a "+" modified range to the lower/worse tier', () => {
            expect(conditionParser('components are VG+ to LN')).toBe('Very Good');
        });

        it('resolves "or better" ranges to the lower/worse tier', () => {
            expect(conditionParser('all VG or better condition')).toBe('Very Good');
        });
    });

    describe('incompleteness overrides wear language', () => {
        it('resolves to Other when a piece is reported missing', () => {
            expect(conditionParser('minor wear, missing one card')).toBe('Other');
        });

        it('resolves to Other for "for parts"', () => {
            expect(conditionParser('Good bones but for parts only, missing pieces')).toBe('Other');
        });
    });

    describe('single-letter false-positive guards', () => {
        it('does not match G inside "Game"', () => {
            expect(conditionParser('Game')).toBeUndefined();
        });

        it('does not match bare N inside "None"', () => {
            expect(conditionParser('None of these are damaged')).toBeUndefined();
        });

        it('does not match VG inside "VGA"', () => {
            expect(conditionParser('Comes with a VGA cable included')).toBeUndefined();
        });
    });

    describe('empty input', () => {
        it('returns undefined for an empty string', () => {
            expect(conditionParser('')).toBeUndefined();
        });

        it('returns undefined for whitespace-only input', () => {
            expect(conditionParser('   \n\t  ')).toBeUndefined();
        });

        it('returns undefined when there is no condition language at all', () => {
            expect(conditionParser('English first edition, 2015')).toBeUndefined();
        });
    });

    describe('BBCode-shaped geeklist bodies', () => {
        it('ignores buildMathTradeBody-style markup and still resolves the headline', () => {
            const body = [
                'Very good condition, minor wear.',
                '',
                '%Options%',
                'Version: [version=123]Catan (2015)[/version]',
                'VersionID: 123',
                'CollectionID: 456',
                '%End%',
            ].join('\n');
            expect(conditionParser(body)).toBe('Very Good');
        });

        it('does not throw on unclosed or malformed tags', () => {
            expect(() => conditionParser('[b]Very good condition')).not.toThrow();
            expect(conditionParser('[b]Very good condition')).toBe('Very Good');
        });
    });
});

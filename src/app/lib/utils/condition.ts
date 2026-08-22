import { TradeItemCondition, TradeItemInteropFormat } from '@/app/lib/types/trade';

type ConditionTier = Exclude<TradeItemCondition, undefined | 'Other'>;

const TIER_RANK: Record<ConditionTier, number> = {
    New: 0,
    'Like New': 1,
    'Very Good': 2,
    Good: 3,
    Acceptable: 4,
};

export const TIER_ABBREVIATION: Record<TradeItemCondition, string> = {
    New: 'N',
    'Like New': 'LN',
    'Very Good': 'VG',
    Good: 'G',
    Acceptable: 'A',
    Other: 'O',
};

// BBCode tags used by this app's own geeklist bodies (see buildMathTradeBody)
// are lowercase, e.g. [b], [/b], [version=123], [/thing]. Uppercase bracketed
// tokens like "(NIS)" or "[N]" are left alone since they're condition codes,
// not markup.
const BBCODE_TAG_PATTERN = /\[\/?[a-z][a-z0-9]*(?:=[^\]]*)?]/g;

const CONDITION_LABEL_PATTERN = /(?:box|game|component)?\s*condition\s*[:=]\s*/gi;

// Fallback for a bare "Box: <rating>" / "Box = <rating>" with no
// "condition" word at all — only used when nothing else (a proper
// "Condition:" label, or a components/contents/cards clause) already
// establishes what's authoritative.
const BOX_ONLY_RATING_PATTERN = /\bbox\s*[:=]\s*([^.,;\n]+)/i;

const BOX_ONLY_CLAUSE_PATTERN = /\bbox\b/i;
const COMPONENT_CLAUSE_PATTERN = /\b(?:component|content|card)s?\b/i;

const RANGE_TOKEN_TO_TIER: Record<string, ConditionTier> = {
    n: 'New',
    new: 'New',
    ln: 'Like New',
    'like new': 'Like New',
    nm: 'Like New',
    vg: 'Very Good',
    'very good': 'Very Good',
    excellent: 'Very Good',
    g: 'Good',
    good: 'Good',
    acceptable: 'Acceptable',
    fair: 'Acceptable',
    ac: 'Acceptable',
    acc: 'Acceptable',
};

const RANGE_TOKEN_ALTERNATION =
    'like new|very good|acceptable|excellent|fair|new|good|vg|ln|nm|acc|ac|n|g';

// "X to Y" captures both tokens; "X or better"/"X or higher" only has one —
// the stated tier is the guaranteed worst case, anything past it is upside.
const RANGE_PATTERN = new RegExp(
    `\\b(${RANGE_TOKEN_ALTERNATION})\\s*[+-]?\\s*(?:to\\s*[+-]?\\s*(${RANGE_TOKEN_ALTERNATION})\\b|or (?:better|higher)\\b)`,
    'i',
);

const OTHER_PATTERN =
    /\b(?:missing (?:a |one |\d+ )?(?:piece|pieces|card|cards|part|parts)|not (?:all )?complete|incomplete|for parts|parts only|box destroyed|unplayable)\b/i;

// Guarded tokens are short enough (1-3 letters, or "good"/"new" bare) that
// they must appear right after a separator/label or at the start of the
// segment, never bare mid-sentence, to avoid matching inside unrelated words
// (Game, None, VGA, ...).
const guardedTokenPattern = (token: string): RegExp =>
    new RegExp(`(?:^|[-:=|,([]\\s*)${token}(?=[\\s.,)\\]]|$)`, 'i');

const NEW_PATTERN =
    /\b(?:sealed|shrink[- ]?wrap(?:ped)?|shrink|factory sealed|unopened|nis|nib|new)\b/i;
const NEW_GUARDED = guardedTokenPattern('n');

// Checked ahead of NEW_PATTERN: the explicit two-word phrase "like new" must
// win over New-tier keywords that can legitimately co-occur in the same
// listing (e.g. real sample text "Like New, unopened in box, not
// shrinkwrapped" — the box being unopened/not-shrinkwrapped is a detail, not
// a contradiction of the stated "Like New" grade).
const LIKE_NEW_PATTERN =
    /\b(?:like new|unpunched|unplayed|never played|no marks)\b/i;
const LIKE_NEW_GUARDED = guardedTokenPattern('ln|nm');

const MINT_PATTERN = /\bmint\b/i;

const VERY_GOOD_PATTERN =
    /\b(?:very good|excellent|great condition|minor wear|shelf ?wear|gently used|played a few times)\b/i;
const VERY_GOOD_GUARDED = guardedTokenPattern('vg');

const GOOD_PATTERN = /\b(?:good condition|visible wear|some wear)\b/i;
const GOOD_GUARDED = guardedTokenPattern('g');
const GOOD_BARE_GUARDED = guardedTokenPattern('good');

const ACCEPTABLE_PATTERN =
    /\b(?:acceptable|heavy wear|heavily played|well worn|fair(?: condition)?)\b/i;
const ACCEPTABLE_GUARDED = guardedTokenPattern('acc?');

// A tier name mentioned as the leading statement of the (label/box-filtered)
// segment is authoritative over any other tier's keyword found later in the
// same text — real listings routinely headline an overall grade and then add
// supporting per-component detail that individually reads like a different
// tier (e.g. "Acceptable condition. Moderate shelfwear, components
// excellent."). Only the five canonical names trigger this — synonyms like
// "excellent" or "mint" still go through normal tier scanning.
const HEADLINE_PATTERN = /^\s*(like new|very good|new|good|acceptable)\b/i;

const stripBBCode = (text: string): string | undefined => text?.replace(BBCODE_TAG_PATTERN, ' ');

/**
 * Traders often label box condition separately from component/contents
 * condition and rate them differently. Box wear is cosmetic; when both are
 * present, drop box-only clauses so tier matching only sees the
 * component/contents rating.
 */
const dropBoxOnlyClauses = (text: string): string => {
    const clauses = text.split(/[.,;]/);
    const hasComponentClause = clauses.some(clause => COMPONENT_CLAUSE_PATTERN.test(clause));
    if (!hasComponentClause) {
        return text;
    }
    return clauses
        .filter(clause => !(BOX_ONLY_CLAUSE_PATTERN.test(clause) && !COMPONENT_CLAUSE_PATTERN.test(clause)))
        .join('. ');
};

/**
 * A "Condition:" (optionally "Box/Game/Component Condition:") label is the
 * dominant convention in geeklist bodies. When present, prefer the segment
 * following the last such label through the end of that sentence/line over
 * scanning the whole body, since surrounding publisher/shipping notes can
 * otherwise contain incidental wear-shaped words.
 */
const extractLabeledSegment = (text: string): string => {
    const matches = [...text.matchAll(CONDITION_LABEL_PATTERN)];
    const lastMatch = matches.at(-1);
    if (!lastMatch || lastMatch.index === undefined) {
        return text;
    }
    const afterLabel = text.slice(lastMatch.index + lastMatch[0].length);
    const sentenceEnd = afterLabel.search(/[.\n](?:\s|$)/);
    return sentenceEnd === -1 ? afterLabel : afterLabel.slice(0, sentenceEnd);
};

const resolveRange = (text: string): ConditionTier | undefined => {
    const match = RANGE_PATTERN.exec(text);
    if (!match) {
        return undefined;
    }
    const [, first, second] = match;
    const firstTier = RANGE_TOKEN_TO_TIER[first.toLowerCase()];
    if (!firstTier) {
        return undefined;
    }
    if (!second) {
        return firstTier;
    }
    const secondTier = RANGE_TOKEN_TO_TIER[second.toLowerCase()];
    if (!secondTier) {
        return firstTier;
    }
    return TIER_RANK[firstTier] >= TIER_RANK[secondTier] ? firstTier : secondTier;
};

const matchTier = (text: string): TradeItemInteropFormat['condition'] => {
    switch (true) {
        case LIKE_NEW_PATTERN.test(text) || LIKE_NEW_GUARDED.test(text):
            return 'Like New';
        case NEW_PATTERN.test(text) || NEW_GUARDED.test(text):
            return 'New';
        case MINT_PATTERN.test(text):
            return 'Like New';
        case VERY_GOOD_PATTERN.test(text) || VERY_GOOD_GUARDED.test(text):
            return 'Very Good';
        case GOOD_PATTERN.test(text) || GOOD_GUARDED.test(text) || GOOD_BARE_GUARDED.test(text):
            return 'Good';
        case ACCEPTABLE_PATTERN.test(text) || ACCEPTABLE_GUARDED.test(text):
            return 'Acceptable';
        default:
            return undefined;
    }
};

export const conditionParser = (description: string): TradeItemCondition | undefined => {
    const stripped = stripBBCode(description)?.trim();
    if (!stripped || stripped.length === 0) {
        return undefined;
    }

    const labeled = extractLabeledSegment(stripped);
    const hadConditionLabel = labeled !== stripped;

    let filtered = dropBoxOnlyClauses(labeled);

    // Only fall back to a bare box rating when it's the sole rating given —
    // i.e. no "Condition:" label already narrowed things, and no
    // components/contents/cards clause exists to take precedence instead.
    if (!hadConditionLabel && !COMPONENT_CLAUSE_PATTERN.test(labeled)) {
        const boxMatch = BOX_ONLY_RATING_PATTERN.exec(labeled);
        if (boxMatch) {
            filtered = boxMatch[1].trim();
        }
    }

    if (OTHER_PATTERN.test(filtered)) {
        return 'Other';
    }

    const range = resolveRange(filtered);
    if (range) {
        return range;
    }

    const headlineMatch = HEADLINE_PATTERN.exec(filtered);
    const headlineTier = headlineMatch && RANGE_TOKEN_TO_TIER[headlineMatch[1].toLowerCase()];
    if (headlineTier) {
        return headlineTier;
    }

    return matchTier(filtered);
};

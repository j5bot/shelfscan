/**
 * Where a collection item's tags can be kept: BGG text fields whose hashtags ShelfScan reads as tags,
 * keyed by the tags mode that edits them.
 */
export const TagLocations = {
    wishlist: { field: 'wishlistcomment', label: 'Wishlist', description: 'the wishlist comment' },
    wantsparts: { field: 'wantpartslist', label: 'Want Parts', description: 'the want parts list' },
    hasparts: { field: 'haspartslist', label: 'Has Parts', description: 'the has parts list' },
} as const;

export type TagLocation = keyof typeof TagLocations;
export type TagField = typeof TagLocations[TagLocation]['field'];

export const TAG_LOCATION_NAMES = Object.keys(TagLocations) as [TagLocation, ...TagLocation[]];

// Matches plain hashtags (#PnP) and "value tags" (#best-at=2, #best-at=5+),
// where the part before `=` is registered as its own tag and the whole string
// as another.
export const HASHTAG_PATTERN = /#[\w-]+(?:=[\w#+-]+)?/g;

/** A single tag, with or without its leading `#`. */
export const SINGLE_TAG_PATTERN = /^#?[\w-]+(?:=[\w#+-]+)?$/;

/** The text's tags, lowercased; a value tag also yields its bare name (`#best-at=2` → `#best-at`). */
export const extractHashtags = (text: string): string[] => {
    const matches = text.match(HASHTAG_PATTERN);
    if (!matches) {
        return [];
    }
    const tags = new Set<string>();
    matches.forEach(match => {
        const tag = match.toLowerCase();
        tags.add(tag);
        const eqIndex = tag.indexOf('=');
        if (eqIndex !== -1) {
            tags.add(tag.slice(0, eqIndex));
        }
    });
    return Array.from(tags);
};

export type TagAction = 'add' | 'remove' | 'set';

/** `best-at=2` → `#best-at=2` */
export const normalizeTag = (tag: string) => {
    const trimmed = tag.trim();
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const tagName = (tag: string) => tag.toLowerCase().split('=')[0];

// drop the matching tags from the text, tidying the spaces they leave behind
const removeMatchingTags = (text: string, matches: (tag: string) => boolean) =>
    text.replace(HASHTAG_PATTERN, tag => matches(tag) ? '' : tag)
        .split('\n')
        .map(line => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
        .join('\n')
        .trim();

const appendTags = (text: string, tags: string[]) =>
    [text, tags.join(' ')].filter(part => part.length > 0).join(text.includes('\n') ? '\n' : ' ');

/**
 * The text with its tags changed, keeping any other text in it:
 * - add: appends the tags not already there; a value tag replaces the same tag's other values
 * - remove: removes the tags; a bare tag also removes its value tags (`#best-at` removes `#best-at=2`)
 * - set: replaces every tag in the text with the given ones
 */
export const applyTagChange = (text: string | undefined, tags: string[], action: TagAction): string => {
    const current = text ?? '';
    const given = tags.map(normalizeTag);
    const givenLower = new Set(given.map(tag => tag.toLowerCase()));
    switch (action) {
        case 'set':
            return appendTags(removeMatchingTags(current, () => true), given);
        case 'remove':
            return removeMatchingTags(current, tag => {
                const lower = tag.toLowerCase();
                return givenLower.has(lower) || givenLower.has(tagName(lower));
            });
        case 'add': {
            // value tags being added replace any other value of the same tag
            const replacedNames = new Set(given.filter(tag => tag.includes('=')).map(tagName));
            const kept = removeMatchingTags(current, tag =>
                tag.includes('=') && replacedNames.has(tagName(tag)) && !givenLower.has(tag.toLowerCase()));
            const present = new Set((kept.match(HASHTAG_PATTERN) ?? []).map(tag => tag.toLowerCase()));
            return appendTags(kept, given.filter(tag => !present.has(tag.toLowerCase())));
        }
    }
};

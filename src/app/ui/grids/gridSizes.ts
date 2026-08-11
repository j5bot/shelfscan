export const GridClasses = {
    small: `grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10`,
    large: `grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`,
} as const;
export type GridClassSize = keyof typeof GridClasses;

export const ThumbnailSizes = {
    small: 100,
    large: 200,
} as const;
export type SizeKey = keyof typeof ThumbnailSizes;

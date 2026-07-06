import { BggCollectionItem } from '@/app/lib/types/bgg';

export const buildMathTradeBody = (
    bodyText: string,
    item: BggCollectionItem,
    copies: number,
    collectionId: number,
): string => {
    const trimmedBody = bodyText.trim();
    const lines: string[] = [];

    const { version, versionId } = item;

    if (trimmedBody.length > 0) {
        lines.push(trimmedBody);
        lines.push('');
    }

    lines.push('%Options%');
    if (version) {
        const languages = version.languages ?
                          version.languages?.length > 0 ?
                            `, Languages: ${version.languages.join(', ')}`
                                                        : '' : '';
        const publisher = version.publisher ? `, Publisher: ${version.publisher}` : '';

        lines.push(`Version: [version=${versionId}]${
            version.name
        } (${
            version.yearPublished
        })${languages}${publisher}[/version]`);
    }
    if (versionId) {
        lines.push(`VersionID: ${versionId}`);
    }
    if (copies > 1) {
        lines.push(`Copies: ${copies}`);
    }
    lines.push(`CollectionID: ${collectionId}`);
    lines.push('%End%');

    return lines.join('\n');
};

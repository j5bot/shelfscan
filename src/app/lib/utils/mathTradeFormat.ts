export const buildMathTradeBody = (
    bodyText: string,
    versionId: number | undefined,
    copies: number,
    collectionId: number,
): string => {
    const trimmedBody = bodyText.trim();
    const lines: string[] = [];

    if (trimmedBody.length > 0) {
        lines.push(trimmedBody);
        lines.push('');
    }

    lines.push('%Options%');
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

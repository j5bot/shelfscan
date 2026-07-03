export const getBggImageId = (url: string | undefined): number => {
    if (!url) { return 0; }
    const match = url.match(/pic(\d+)\./);
    return match ? parseInt(match[1], 10) : 0;
};

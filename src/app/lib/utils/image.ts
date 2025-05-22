const imageSizeRegExp = /\/fit-in\/(\d+)x(\d+)\//;

export const getImageSizeFromUrl = (url: string) => {
    const matches = imageSizeRegExp.exec(url);
    if (!matches) {
        return { height: 200, width: 200 };
    }

    return { height: parseInt(matches[2], 10), width: parseInt(matches[1], 10) };
};

const imageSizeRegExp = /\/fit-in\/(\d+)x(\d+)\//;
const imageIdRegExp = /\/pic(\d+)\./;

// https://cf.geekdo-images.com/lQ30lGbVg8qYbNKFzQAMbQ__thumb/img/kpbKK9V-gglwtmwdvutYYxj9iCc=/fit-in/200x150/filters:strip_icc()/pic2499362.jpg
export const getImageIdFromUrl = (url: string) => {
    const matches = imageIdRegExp.exec(url);
    if (!matches) {
        return -1;
    }
    return parseInt(matches[1], 10);
}

export const getImageSizeFromUrl = (url: string) => {
    const matches = imageSizeRegExp.exec(url);
    if (!matches) {
        return { height: 200, width: 200 };
    }

    return { height: parseInt(matches[2], 10), width: parseInt(matches[1], 10) };
};

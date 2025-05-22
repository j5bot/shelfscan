import sleep from 'sleep-promise';

const maxRetries = 15;
const waitInterval = 300;

const xmlErrorRegExp = /<error/mig;
const xmlMessageRegExp = /<message/mig;

export const textFetchAndWait = async (
    url: string,
    depth: number = 0,
): Promise<string> => {
    return fetch(url)
        .then((response) => response.text())
        .then(async (text) => {
            if (xmlErrorRegExp.test(text) && xmlMessageRegExp.test(text)) {
                if (depth > maxRetries) {
                    throw Error(
                        `Failed to fetch ${url} after ${depth + 1} tries`,
                    );
                }
                await sleep(2 ** depth * waitInterval);
                return await textFetchAndWait(url, depth + 1);
            } else {
                return text;
            }
        });
};
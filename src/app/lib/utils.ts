import sleep from 'sleep-promise';

const maxRetries = 15;
const waitInterval = 300;

const xmlErrorRegExp = /<error/mi;
const xmlMessageRegExp = /<message/mi;

export const textFetchAndWait = async (
    url: string,
    depth: number = 0,
): Promise<string> => {
    const retry = async (): Promise<string> => {
        if (depth > maxRetries) {
            throw Error(
                `Failed to fetch ${url} after ${depth + 1} tries`,
            );
        }
        await sleep(2 ** depth * waitInterval);
        return await textFetchAndWait(url, depth + 1);
    };

    return fetch(url)
        .then(async (response) => {
            if (!response.ok) {
                return retry();
            }
            const text = await response.text();
            if (xmlErrorRegExp.test(text) && xmlMessageRegExp.test(text)) {
                return retry();
            }
            return text;
        });
};

export const firstNonEmptyOrUndefined = (...candidates: Array<string | undefined>) =>
    candidates?.find(candidate => candidate && candidate.length > 0 ? candidate : false);

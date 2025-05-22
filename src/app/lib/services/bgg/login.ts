import { bggCookieHost, bggWorkerHost } from './constants';

const loginAPIUrl = `${bggWorkerHost}/login/api/v1`;

const okStatus = 200;
const noContentStatus = 204;

export let bggCookie: string;

export const doBggLogin = async (userName: string, password: string) => {
    return fetch(loginAPIUrl, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            cookie: bggCookie,
        },
        body: JSON.stringify({
            credentials: {
                username: userName,
                password: password,
            },
        }),
    }).then(async (response) => {
        const cookie = await response.text().then(cookie => {
            bggCookie = cookie.replace(/\.boardgamegeek\.com/ig, bggCookieHost);
            return bggCookie;
        });

        return {
            cookie,
            loginResponse: response.status === noContentStatus || response.status === okStatus
        };
    });
};

export {};
import { bggHost } from './constants';

const okStatus = 200;
const noContentStatus = 204;

export const doBggGetUser = async (userName: string) => {
    return fetch(loginAPIUrl, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            credentials: {
                username: userName,
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
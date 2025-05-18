import { bggWorkerHost } from './service';

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
        },
        body: JSON.stringify({
            credentials: {
                username: userName,
                password: password,
            },
        }),
    }).then((response) => {
        response.text().then(cookie => {
            bggCookie = cookie;
            return bggCookie;
        }).then(console.log);
        return response.status === noContentStatus || response.status === okStatus;
    });
};

export {};
'use server';

import { bggHost } from '@/app/lib/services/bgg/constants';
import sleep from 'sleep-promise';
import { z } from 'zod';

const bggCollectionBaseURL = `${bggHost}/xmlapi2/collection`;
const bggUserBaseURL = `${bggHost}/xmlapi2/user`;

export type BggUserState = {
    data: {
        username?: string;
    };
    message?: string;
    errors: {
        login?: string[];
        username?: string[];
    }
};

const BggFormSchema = z.object({
    username: z.string({
        required_error: 'Please enter a BGG username',
    }),
});

const MAX_ATTEMPTS = 20;

const fetchFromBggWithToken = async (url: string, args: RequestInit, attempts: number = 0) => {
    if (attempts > MAX_ATTEMPTS) {
        return Promise.reject('Too many retries');
    }
    const bggToken = process.env.BGG_TOKEN;
    if (!bggToken) {
        throw new Error('cannot fetch from BGG without token');
    }

    const headerToAdd = {
        Authorization: `Bearer ${bggToken}`,
    };
    // precedence given to existing headers
    args.headers = Object.assign({}, headerToAdd, args.headers);
    // console.log(JSON.stringify(args, undefined, 2));
    const response = await fetch(url, args);

    if (response.status === 202 && attempts < MAX_ATTEMPTS) {
        await sleep(2000);
        return await fetchFromBggWithToken(url, args, attempts + 1);
    }
    return response;
};

export const bggGetUser = async (formData: FormData) => {
    const formDataObject = Object.fromEntries(formData);

    const validated = BggFormSchema
        .safeParse(formDataObject);

    if (!validated.success) {
        return '';
    }

    return bggGetUserInner(validated.data.username);
};

export const bggGetUserInner = async (username: string) => {
    const bggUserUrl = new URL(bggUserBaseURL);
    bggUserUrl.searchParams.append('name', username);
    bggUserUrl.searchParams.append('buddies', '1');

    return await fetchFromBggWithToken(bggUserUrl.toString(), {}).then(r => r.text());
};

export const bggGetCollection = async (formData: FormData)=> {
    const formDataObject = Object.fromEntries(formData);

    const validated = BggFormSchema
        .safeParse(formDataObject);

    if (!validated.success) {
        return '';
    }

    return await bggGetCollectionInner(validated.data.username, 0);
};

export const bggGetCollectionInner =
    async (username: string, attempts: number = 0): Promise<string> => {
        if (attempts > MAX_ATTEMPTS) {
            return '';
        }

        const collectionUrl = new URL(bggCollectionBaseURL);
        const cuParams = collectionUrl.searchParams;

        cuParams.append('username', username);
        cuParams.append('own', '1');
        cuParams.append('version', '1');

        return await fetchFromBggWithToken(collectionUrl.toString(), {}).then(r => r.text());
 };

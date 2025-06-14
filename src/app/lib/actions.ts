'use server';

import { bggHost } from '@/app/lib/services/bgg/constants';
import sleep from 'sleep-promise';
import { z } from 'zod';

const bggCollectionBaseURL = `${bggHost}/xmlapi2/collection`;

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

export async function bggSetUser(prevState: BggUserState, formData: FormData) {
    void prevState;

    const formDataObject = Object.fromEntries(formData);

    const validated = BggFormSchema
        .safeParse(formDataObject);

    if (!validated.success) {
        return {
            data: {},
            errors: validated.error.flatten().fieldErrors,
            message: 'Missing login details, unable to log in',
        };
    }

    return {
        data: validated.data,
        errors: {},
    };
}

const MAX_ATTEMPTS = 20;

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

        const response = await fetch(collectionUrl.toString());

        // basic throttling
        if (response.status === 202) {
            await sleep(2000);
            return await bggGetCollectionInner(username, attempts + 1);
        }

        return await response.text();
    };

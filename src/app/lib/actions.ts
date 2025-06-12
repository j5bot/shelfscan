'use server';

import { doBggLogin } from '@/app/lib/services/bgg/login';
import { z } from 'zod';

export type BggUserState = {
    data: {
        username?: string;
        cookie?: string;
    };
    message?: string;
    errors: {
        login?: string[];
        username?: string[];
        password?: string[];
    }
};

const BggLoginFormSchema = z.object({
    username: z.string({
        required_error: 'Please enter a BGG username',
    }),
    password: z.string({
        required_error: 'Please enter a BGG user password',
    }),
});

export async function bggSetUser(prevState: BggUserState, formData: FormData) {
    void prevState;

    const formDataObject = Object.fromEntries(formData);

    const validated = BggLoginFormSchema
        .safeParse(formDataObject);

    if (!validated.success) {
        return {
            data: {},
            errors: validated.error.flatten().fieldErrors,
            message: 'Missing login details, unable to log in',
        };
    }

    const { loginResponse, cookie } = await doBggLogin(validated.data.username, validated.data.password);

    if (!loginResponse) {
        return {
            data: {},
            errors: { login: ['Login failed.'] },
            message: 'Login failed',
        };
    }

    return {
        data: { ...validated.data, cookie },
        errors: {},
    };
}

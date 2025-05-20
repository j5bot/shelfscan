'use server';

import { doBggLogin } from '@/app/lib/services/bgg/login';
import { z } from 'zod';

export type BggLoginState = {
    message?: string;
    errors: {
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

export async function bggLogin(prevState: BggLoginState, formData: FormData) {
    const formDataObject = Object.fromEntries(formData);

    const validated = BggLoginFormSchema
        .safeParse(formDataObject);

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: 'Missing login details, unable to log in',
        };
    }

    return await doBggLogin(validated.data.username, validated.data.password);
}

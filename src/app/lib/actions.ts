'use server';

import { z } from 'zod';

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

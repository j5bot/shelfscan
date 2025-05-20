import { bggLogin } from '@/app/lib/actions';
import React, { useActionState } from 'react';

export function BggLoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(bggLogin, undefined);

    return (
        <form action={formAction}>
            <fieldset className="bg-gray-100 rounded-lg flex gap-4 p-5">
                <input className="bg-white p-2 rounded-md"
                       type="text" name="username" placeholder="BGG Username" />
                <input className="bg-white p-2 rounded-md"
                       type="password" name="password" placeholder="BGG Password" />
                <button
                    className="p-2 rounded-md bg-gray-200 cursor-pointer whitespace-nowrap"
                    name="login"
                    disabled={isPending} aria-disabled={isPending}
                    type="submit"
                >
                    Log In
                </button>
            </fieldset>
        </form>
    );
}

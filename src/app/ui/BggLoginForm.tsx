'use client';

import { bggLogin, BggLoginState } from '@/app/lib/actions';
import { useDispatch } from '@/app/lib/hooks';
import { useActionStateWithCallbacks } from '@/app/lib/hooks/useActionStateWithCallbacks';
import { fetchBggUser, setCookie } from '@/app/lib/redux/bgg/user/slice';
import React from 'react';

export function BggLoginForm() {
    const dispatch = useDispatch();
    const [state, formAction, isPending] = useActionStateWithCallbacks<BggLoginState>({
        action: bggLogin as any,
        initialState: {
            data: {},
            errors: {},
        },
        callbacks: [
            (state: BggLoginState) => {
                const { username, cookie } = state.data;
                if (!(username && cookie)) {
                    return;
                }
                dispatch(fetchBggUser(username));
                dispatch(setCookie(cookie));
            }
        ],
    });

    void state;

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

'use client';

import { bggSetUser, BggUserState } from '@/app/lib/actions';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useActionStateWithCallbacks } from '@/app/lib/hooks/useActionStateWithCallbacks';
import { fetchBggUser } from '@/app/lib/redux/bgg/user/slice';
import Image from 'next/image';
import React from 'react';

export function BggUserForm() {
    const dispatch = useDispatch();
    const { user, firstName, avatarUrl } = useSelector(state => state.bgg.user);

    const [state, formAction, isPending] = useActionStateWithCallbacks<BggUserState>({
        // I don't know why this type is arguing ... the action param is supposed to take formData
        action: (bggSetUser as unknown) as
            Parameters<(typeof useActionStateWithCallbacks<BggUserState>)>[0]['action'],
        initialState: {
            data: {},
            errors: {},
        },
        callbacks: [
            (state: BggUserState) => {
                const { username } = state.data;
                if (!username) {
                    return;
                }
                dispatch(fetchBggUser(username));
            }
        ],
    });

    void state;

    const containerClassName = 'bg-gray-100 rounded-lg flex flex-wrap gap-4 p-3';
    const displayName = `${firstName} [${user}]`;

    return user ? (
        <div className={`${containerClassName}`}>
            {avatarUrl ? (<Image
                className="rounded-4xl"
                src={avatarUrl}
                alt={displayName}
                width={32} height={32}
            />) : null}
            {displayName}
        </div>
    ) : (
        <form action={formAction} className="w-full">
            <fieldset className={containerClassName}>
                <input className="grow bg-white p-2 rounded-md max-w-3/8"
                       type="text" name="username" placeholder="BGG Username" />
                <button
                    className="grow p-2 rounded-md bg-gray-200 cursor-pointer whitespace-nowrap max-w-1/4"
                    name="login"
                    disabled={isPending} aria-disabled={isPending}
                    type="submit"
                >
                    Set User
                </button>
            </fieldset>
        </form>
    );
}

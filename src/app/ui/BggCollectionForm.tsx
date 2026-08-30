'use client';

import { setSetting } from '@/app/lib/database/database';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useSettings } from '@/app/lib/SettingsProvider';
import { useLoadUser } from '@/app/lib/hooks/useLoadUser';
import React, { ChangeEvent, useEffect, useState } from 'react';

export const BggCollectionForm = ()=> {
    const { settings } = useSettings();
    const { loaded: settingsLoaded, username: settingsUsername } = settings;

    const { isPending, loadUser } = useLoadUser();

    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    const [username, setUsername] = useState<string | undefined>();

    useEffect(() => {
        if (!(currentUsername || settingsUsername)) {
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsername(currentUsername ?? settingsUsername as string);
    }, [currentUsername, settingsUsername, setUsername]);

    const getCollectionAction = async (formData: FormData) => {
        if (isPending) {
            return;
        }
        loadUser(
            formData.get('username')?.toString(),
        );
    };

    if (!settingsLoaded) {
        return null;
    }

    return !(currentUsername || settingsUsername) && settingsLoaded &&
        <form action={getCollectionAction} className="w-full">
            <fieldset className={`bg-gray-100 dark:bg-gray-900 rounded-t-lg flex flex-wrap gap-2 p-2 justify-center items-center`}>
                <input className="grow bg-white inset-shadow-xs/40 inset-shadow-gray-400 dark:bg-gray-700 p-2 rounded-md max-w-3/8 md:max-w-64"
                       type="text" name="username"
                       id="bgg-username"
                       placeholder="BGG Username"
                       autoComplete={'autocomplete'}
                       defaultValue={username}
                />
                <div className="get-collection-section flex gap-2 items-center">
                    <button
                        className="grow p-2 px-4 rounded-md bg-gray-200 dark:bg-gray-500 cursor-pointer whitespace-nowrap max-w-1/4 min-w-fit md:max-w-52"
                        name="getCollection"
                        disabled={isPending} aria-disabled={isPending}
                        type="submit"
                    >{isPending ? <span className="loading loading-bars loading-xs" />
                         : <>Get Collection</>}
                    </button>
                </div>
            </fieldset>
        </form>;
};

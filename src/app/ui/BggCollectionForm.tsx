'use client';

import { setSetting } from '@/app/lib/database/database';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useSettings } from '@/app/lib/SettingsProvider';
import { useLoadUser } from '@/app/lib/hooks/useLoadUser';
import React, { ChangeEvent, useEffect, useState } from 'react';

export const BggCollectionForm = ()=> {
    const { settings, loadSettings } = useSettings();
    const { rememberMe, loaded: settingsLoaded, username: settingsUsername } = settings;

    const { isPending, loadUser } = useLoadUser();

    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);
    const [username, setUsername] = useState<string | undefined>();

    useEffect(() => {
        if (!(currentUsername || settingsUsername)) {
            return;
        }
        setUsername(currentUsername ?? settingsUsername as string);
    }, [currentUsername, settingsUsername, setUsername]);

    const setRememberMe = async (e: ChangeEvent<HTMLInputElement>) => {
        await setSetting('rememberMe', e.currentTarget.checked);
        loadSettings().then();
    };

    const getCollectionAction = async (formData: FormData) => {
        if (isPending) {
            return;
        }
        loadUser(
            formData.get('username')?.toString(),
            formData.get('rememberMe') === 'true',
            formData.get('useCache') === 'true'
        );
    };

    const formStyle = {
        fontSize: '0.8em',
    };
    const labelStyle = { fontSize: '0.7em', '--size-selector': '0.2rem' };

    if (!settingsLoaded) {
        return null;
    }

    return !(currentUsername || (settingsUsername && rememberMe)) && settingsLoaded && <form action={getCollectionAction} className="w-full">
            <fieldset style={formStyle} className={`bg-gray-100 dark:bg-gray-900 rounded-lg flex flex-wrap gap-2 p-2 justify-center items-center`}>
                <input className="grow bg-white inset-shadow-xs/40 inset-shadow-gray-400 dark:bg-gray-700 p-2 rounded-md max-w-3/8 md:max-w-64"
                       type="text" name="username"
                       id="bgg-username"
                       placeholder="BGG Username"
                       autoComplete={'autocomplete'}
                       defaultValue={username}
                />
                <button
                    className="grow p-2 rounded-md bg-gray-200 dark:bg-gray-500 cursor-pointer whitespace-nowrap max-w-1/4 min-w-fit md:max-w-52"
                    name="getCollection"
                    id="bgg-get-collection"
                    disabled={isPending} aria-disabled={isPending}
                    type="submit"
                >{isPending ? <span className="loading loading-bars loading-xs" />
                     : <>Get Collection</>}
                </button>
                <div className="flex flex-col gap-1">
                    <label style={labelStyle} htmlFor="useCache" className="flex items-center gap-1">
                        <input disabled={isPending} aria-disabled={isPending}
                               type="checkbox" value="true" defaultChecked={true} id="useCache"
                               name="useCache" className="checkbox h-3 w-3 rounded-sm p-0.5" /> Use Cache
                    </label>
                    <label style={labelStyle} htmlFor="rememberMe" className="flex items-center gap-1">
                        <input type="checkbox" value="true" defaultChecked={!!rememberMe} id="rememberMe"
                               name="rememberMe" className="checkbox h-3 w-3 rounded-sm p-0.5"
                               onChange={setRememberMe}
                        /> Remember Me
                    </label>
                </div>
            </fieldset>
        </form>;
};

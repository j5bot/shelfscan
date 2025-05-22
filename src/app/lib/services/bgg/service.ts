import { bggWorkerHost } from '@/app/lib/services/bgg/constants';
import { BggUser } from '@/app/lib/types/BggUser';
import { textFetchAndWait } from '@/app/lib/utils';
import { getPageDOM } from '@/app/lib/utils/xml';

const userAPI = `${bggWorkerHost}/xmlapi2/user?name=`;

export const getBggUser = async (name: string): Promise<BggUser> => {
    return await textFetchAndWait(`${userAPI}${name}`)
        .then(text => getPageDOM(text, true))
        .then((document) => {
        const id = document.querySelector('user')?.getAttribute('id');
        const lastLogin = document
            .querySelector('lastlogin')
            ?.getAttribute('value');
        const firstName = document
            .querySelector('firstname')
            ?.getAttribute('value');
        const lastName = document
            .querySelector('lastname')
            ?.getAttribute('value');
        const state = document
            .querySelector('stateorprovince')
            ?.getAttribute('value');
        const country = document
            .querySelector('country')
            ?.getAttribute('value');
        const tradeRating = parseFloat(
            document.querySelector('traderating')?.getAttribute('value') ?? '0',
        );
        const marketRating = parseFloat(
            document.querySelector('marketrating')?.getAttribute('value') ??
            '0',
        );

        return {
            user: name,
            id,
            lastLogin,
            firstName,
            lastName,
            state,
            country,
            tradeRating,
            marketRating,
        } as BggUser;
    });
};

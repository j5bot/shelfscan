import { PropsWithChildren } from 'react';

export const GameListContainer = ({ children }: PropsWithChildren<{}>) => {
    return <ul className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {children}
    </ul>
};

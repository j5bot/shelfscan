import { SyntheticEvent, useEffect, useState } from 'react';

export type UseGameDetailsSearchOptions = {
    onSearch: (search: string) => void;
    initialQuery?: string;
    initialOpen?: boolean;
};

export const useGameDetailsSearch = ({
    onSearch,
    initialQuery = '',
    initialOpen,
}: UseGameDetailsSearchOptions) => {
    const [searchFormOpen, setSearchFormOpen] = useState<boolean>(initialOpen ?? !initialQuery);
    const [searchString, setSearchString] = useState<string>(initialQuery);

    useEffect(() => {
        if (initialOpen !== undefined) {
            setSearchFormOpen(initialOpen);
        }
    }, [initialOpen]);

    useEffect(() => {
        setSearchString(initialQuery);
    }, [initialQuery]);

    const searchBlurHandler = (e: SyntheticEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        const url = new URL(window.location.href);
        url.searchParams.set('q', value);
        window.history.pushState(undefined, '', url.toString());
        setSearchString(value);
    };

    const searchClickHandler = () => {
        onSearch(searchString);
    };

    return {
        searchFormOpen,
        setSearchFormOpen,
        searchString,
        searchBlurHandler,
        searchClickHandler,
    };
};


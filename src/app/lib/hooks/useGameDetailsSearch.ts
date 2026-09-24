import { SyntheticEvent, useState } from 'react';

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
    // a user change applies until the prop it was made against changes
    const [openChange, setOpenChange] = useState<{ open: boolean; basis: boolean | undefined }>();
    const [searchChange, setSearchChange] = useState<{ search: string; basis: string }>();

    const defaultOpen = initialOpen ?? !initialQuery;
    const searchFormOpen = openChange && openChange.basis === initialOpen ? openChange.open : defaultOpen;
    const searchString = searchChange && searchChange.basis === initialQuery ? searchChange.search : initialQuery;

    const setSearchFormOpen = (open: boolean) => {
        setOpenChange({ open, basis: initialOpen });
    };

    const searchBlurHandler = (e: SyntheticEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        const url = new URL(window.location.href);
        url.searchParams.set('q', value);
        window.history.pushState(undefined, '', url.toString());
        setSearchChange({ search: value, basis: initialQuery });
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


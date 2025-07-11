'use client';

import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import { createContext, ReactNode, useContext } from 'react';

export type SelectVersionContext = ReturnType<typeof useSelectVersion>;

export const SelectVersionContext =
    createContext<SelectVersionContext>({} as SelectVersionContext);

export type SelectVersionProviderProps = {
    id: string;
    children?: ReactNode;
};

export const useSelectVersionContext = () => useContext<SelectVersionContext>(SelectVersionContext);

export const SelectVersionProvider = (props: SelectVersionProviderProps) => {
    const selectVersion = useSelectVersion(props.id);
    return <SelectVersionContext.Provider value={selectVersion}>
        {props.children}
    </SelectVersionContext.Provider>;
};

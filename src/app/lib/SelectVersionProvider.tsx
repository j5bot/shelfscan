'use client';

import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import { createContext, ReactNode, useContext } from 'react';

export type SelectVersionContext = ReturnType<typeof useSelectVersion>;

export const SelectVersionContext =
    createContext<SelectVersionContext>({} as SelectVersionContext);

export type SelectVersionProviderProps = {
    id?: string;
    infos?: GameUPCBggInfo[];
    versions?: GameUPCBggVersion[];
    children?: ReactNode;
};

export const useSelectVersionContext = () => useContext<SelectVersionContext>(SelectVersionContext);

export const SelectVersionProvider = (props: SelectVersionProviderProps) => {
    const { id, infos, versions, children } = props;
    const selectVersion = useSelectVersion({ id, infos, versions });
    return <SelectVersionContext.Provider value={selectVersion}>
        {children}
    </SelectVersionContext.Provider>;
};

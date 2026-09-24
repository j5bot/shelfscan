'use client';

import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import { SelectVersionContext } from '@/app/lib/SelectVersionContext';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import { ReactNode, useContext } from 'react';

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

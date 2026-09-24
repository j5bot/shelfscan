import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import { createContext } from 'react';

export type SelectVersionContext = ReturnType<typeof useSelectVersion>;

export const SelectVersionContext =
    createContext<SelectVersionContext>({} as SelectVersionContext);

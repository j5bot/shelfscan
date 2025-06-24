import { createContext, ReactNode, useContext, useState } from 'react';

export type Codes = string[];

const CodesContext =
    createContext<{
        codes: Codes;
        setCodes: (codes: Codes) => void;
    }>({ codes: [], setCodes: () => undefined });

type Props = {
    children: ReactNode;
};

export const useCodes = () =>
    useContext(CodesContext);

export const CodesProvider = ({ children }: Props) => {
    const [codes, setCodes] = useState<Codes>([]);

    return <CodesContext.Provider value={{ codes, setCodes }}>
        {children}
    </CodesContext.Provider>;
};

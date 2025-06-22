import { useGameUPCApi } from '@/app/lib/hooks/useGameUPCApiWithPending';
import { createContext, ReactNode, useContext } from 'react';

const GameUPCDataContext =
    createContext<ReturnType<typeof useGameUPCApi>>({} as
        ReturnType<typeof useGameUPCApi>);

type Props = {
    children: ReactNode;
};

export const useGameUPCData = () =>
    useContext(GameUPCDataContext);

export const GameUPCDataProvider = ({ children }: Props) => {
    const gameUPCData = useGameUPCApi();

    return <GameUPCDataContext.Provider value={gameUPCData}>
        {children}
    </GameUPCDataContext.Provider>;
};

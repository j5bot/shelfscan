import { useGameUPC } from 'gameupc-hooks/useGameUPC';
import { createContext, ReactNode, useContext } from 'react';

const GameUPCDataContext =
    createContext<ReturnType<typeof useGameUPC>>({} as
        ReturnType<typeof useGameUPC>);

type Props = {
    children: ReactNode;
};

export const useGameUPCData = () =>
    useContext(GameUPCDataContext);

export const GameUPCDataProvider = ({ children }: Props) => {
    const gameUPCData = useGameUPC({ updaterId: 'ShelfScan' });

    return <GameUPCDataContext.Provider value={gameUPCData}>
        {children}
    </GameUPCDataContext.Provider>;
};

import { createContext, ReactNode, useContext, useState } from 'react';

export type GameSelections = Record<string, number[]>;

const GameSelectionsContext =
    createContext<{
         gameSelections: GameSelections;
         setGameSelections: (gameSelections: GameSelections) => void;
     }>({ gameSelections: {}, setGameSelections: () => undefined });

type Props = {
    children: ReactNode;
};

export const useGameSelections = () =>
    useContext(GameSelectionsContext);

export const GameSelectionsProvider = ({ children }: Props) => {
    const [gameSelections, setGameSelections] = useState<GameSelections>({});

    return <GameSelectionsContext.Provider value={{ gameSelections, setGameSelections }}>
        {children}
    </GameSelectionsContext.Provider>;
};

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

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

    const value = useMemo(() => ({ gameSelections, setGameSelections }), [gameSelections]);

    return <GameSelectionsContext.Provider value={value}>
        {children}
    </GameSelectionsContext.Provider>;
};

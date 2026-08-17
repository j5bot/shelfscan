import { useGameUPC } from 'gameupc-hooks/useGameUPC';
import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext } from 'react';

const GameUPCDataContext =
    createContext<ReturnType<typeof useGameUPC>>({} as
        ReturnType<typeof useGameUPC>);

type Props = {
    children: ReactNode;
};

export const useGameUPCData = () =>
    useContext(GameUPCDataContext);

// Routes whose component tree reads from GameUPCDataContext (scanner views,
// plus collection/version-detail views that look up previously-scanned data).
// Mounting the warm provider only on these routes keeps the GameUPC API
// warmup call from firing on every page (about, privacy, extension, etc.).
const GAMEUPC_EXACT_ROUTES = new Set(['/', '/batch', '/swapscan', '/collection', '/swap']);
const GAMEUPC_ROUTE_PREFIXES = ['/math-trade/', '/upc/'];

const routeNeedsGameUPC = (pathname: string) =>
    GAMEUPC_EXACT_ROUTES.has(pathname) ||
    GAMEUPC_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

const WarmGameUPCDataProvider = ({ children }: Props) => {
    const gameUPCData = useGameUPC({ updaterId: 'ShelfScan' });

    return <GameUPCDataContext.Provider value={gameUPCData}>
        {children}
    </GameUPCDataContext.Provider>;
};

export const GameUPCDataProvider = ({ children }: Props) => {
    const pathname = usePathname();

    if (!routeNeedsGameUPC(pathname)) {
        return children;
    }

    return <WarmGameUPCDataProvider>{children}</WarmGameUPCDataProvider>;
};

import { AppStore, makeStore } from '@/app/lib/redux/store';
import { ReactNode, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

export function Provider({ children }: { children: ReactNode }) {
    const [store] = useState<AppStore>(() => makeStore());

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
}

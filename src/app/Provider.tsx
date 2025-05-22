import { AppStore, makeStore } from '@/app/lib/redux/store';
import { useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

export function Provider({ children }: { children: React.ReactNode }) {
    const storeRef = useRef<AppStore | null>(null);
    if (!storeRef.current) {
        storeRef.current = makeStore();
    }

    return <ReduxProvider store={storeRef.current}>{children}</ReduxProvider>;
}

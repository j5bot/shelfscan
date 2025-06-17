import { useActionState, useEffect, useState } from 'react';

export type UseActionStateWithCallbacksParams<T, U = void> = {
    action: Parameters<(typeof useActionState<T>)>[0];
    initialState: Parameters<(typeof useActionState<T>)>[1];
    callbacks?: ((state: T) => U)[];
    permalink?: Parameters<(typeof useActionState<T>)>[2];
};

/*
 A hook which combines `useActionState` with a `useEffect` to run callbacks
 every time that the state changes.  An array of results is returned as part
 of the output of the function.

 Other than using a params object, this hook is backwards compatible with
 `useActionState`, because `callbacks` may be undefined or empty.
 */
export const useActionStateWithCallbacks =
    <T, U = void>(params: UseActionStateWithCallbacksParams<T, U>):
        [T, () => void, boolean, U[]] => {
    const { action, callbacks, initialState, permalink } = params;
    const [state, formAction, isPending] = useActionState<T>(action, initialState, permalink);
    const [results, setResults] = useState<U[]>([]);

    useEffect(() => {
        if (!callbacks?.length) {
            return;
        }
        setResults(callbacks.map(callback => callback(state)));
    }, [setResults, state]);

    return [state, formAction, isPending, results];
};

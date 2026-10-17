/** Promise.withResolvers() without it: Safari only has it from 17.4. */
export const createResolvers = <T>(): PromiseWithResolvers<T> => {
    let resolve!: PromiseWithResolvers<T>['resolve'];
    let reject!: PromiseWithResolvers<T>['reject'];
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

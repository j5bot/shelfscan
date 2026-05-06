import PQueue from 'p-queue';

const FETCH_THROTTLE_MS = 300;

const queue = new PQueue({
    concurrency: 1,
    interval: FETCH_THROTTLE_MS,
    intervalCap: 1,
});

export const enqueueFetch = <T>(fn: () => Promise<T>): Promise<T> =>
    queue.add(fn) as Promise<T>;


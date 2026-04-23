const FETCH_THROTTLE_MS = 500;

type QueueEntry = {
    execute: () => void;
};

let queue: QueueEntry[] = [];
let draining = false;

const drain = () => {
    if (draining || queue.length === 0) {
        return;
    }
    draining = true;
    const entry = queue.shift()!;
    entry.execute();
    setTimeout(() => {
        draining = false;
        drain();
    }, FETCH_THROTTLE_MS);
};

export const enqueueFetch = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        queue.push({
            execute: () => {
                fn().then(resolve, reject);
            },
        });
        drain();
    });
};


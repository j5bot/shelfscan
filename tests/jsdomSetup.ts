import type { EventEmitter } from 'node:events';

type SetMaxListeners = (n?: number, ...eventTargets: (EventEmitter | EventTarget)[]) => void;
type EventsModule = { setMaxListeners: SetMaxListeners };

// p-queue 10 extends `EventTarget` and raises its listener limit with Node's `setMaxListeners` whenever `process`
// exists. Under jsdom `EventTarget` is jsdom's, which Node rejects, so skip the call for jsdom targets.
const events = process.getBuiltinModule('node:events') as EventsModule;
const setMaxListeners = events.setMaxListeners;
events.setMaxListeners = (n, ...eventTargets) => {
    const nodeTargets = eventTargets.filter(target => !(target instanceof globalThis.EventTarget));
    if (eventTargets.length === 0 || nodeTargets.length > 0) {
        setMaxListeners(n, ...nodeTargets);
    }
};

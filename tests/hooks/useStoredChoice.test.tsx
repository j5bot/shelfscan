import { describe, it, expect, beforeEach, afterEach } from '../setup';
import { useStoredChoice } from '@/app/lib/hooks/useStoredChoice';
import { act, RefObject, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

const KEY = 'test-choice';
const CHOICES = ['a', 'b', 'c'] as const;
type Choice = typeof CHOICES[number];

type Setter = (next: Choice) => void;
type ProbeProps = { setterRef?: RefObject<Setter | null> };

const Probe = ({ setterRef }: ProbeProps) => {
    const [value, setValue] = useStoredChoice<Choice>(KEY, CHOICES, 'a');
    useEffect(() => {
        if (setterRef) {
            setterRef.current = setValue;
        }
    }, [setterRef, setValue]);
    return <span>{value}</span>;
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('useStoredChoice', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it('renders the fallback on the server even when a value is stored', () => {
        localStorage.setItem(KEY, 'b');
        expect(renderToString(<Probe />)).toContain('>a<');
    });

    it('uses the stored value in the browser', () => {
        localStorage.setItem(KEY, 'c');
        act(() => root.render(<Probe />));
        expect(container.textContent).toBe('c');
    });

    it('ignores stored values that are not valid choices', () => {
        localStorage.setItem(KEY, 'nope');
        act(() => root.render(<Probe />));
        expect(container.textContent).toBe('a');
    });

    it('persists a new value and updates every consumer of the key', () => {
        const setterRef: RefObject<Setter | null> = { current: null };
        act(() => root.render(<>
            <Probe setterRef={setterRef} />
            <Probe />
        </>));

        act(() => setterRef.current?.('b'));

        expect(localStorage.getItem(KEY)).toBe('b');
        expect(container.textContent).toBe('bb');
    });
});

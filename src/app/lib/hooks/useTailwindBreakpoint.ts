import { useEffect, useLayoutEffect, useState } from 'react';

const TailwindCSSBreakIds = {
    mobile: 'mobile',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl',
} as const;

export type TailwindCSSBreakId = keyof typeof TailwindCSSBreakIds;

const TailwindCSSBreaks = [
    { prefix: false, size: TailwindCSSBreakIds.mobile },
    { prefix: true, size: TailwindCSSBreakIds.sm },
    { prefix: true, size: TailwindCSSBreakIds.md },
    { prefix: true, size: TailwindCSSBreakIds.lg },
    { prefix: true, size: TailwindCSSBreakIds.xl },
    { prefix: true, size: TailwindCSSBreakIds['2xl'] },
];

export const useTailwindBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState<TailwindCSSBreakId>('mobile');
    const [addedElements, setAddedElements] = useState<boolean>(true);
    useLayoutEffect(() => {
        TailwindCSSBreaks.forEach(bp => {
            const { size } = bp;
            const breakDetect = document.createElement('div');
            const className = TailwindCSSBreaks.map(innerBp => {
                const cssPrefix = !innerBp.prefix ? '' : `${innerBp.size}:`;
                // return innerBp.size === size ? `${cssPrefix}w-2 ${cssPrefix}h-2` : `${cssPrefix}w-0 ${cssPrefix}h-0`;
                return innerBp.size === size ? `${cssPrefix}w-2 ${cssPrefix}h-2` : `${cssPrefix}w-0 ${cssPrefix}h-0`;
            }).join(' ');
            breakDetect.className = `${className}`;
            breakDetect.id = `${size}-breakpoint-detect`;
            document.body.appendChild(breakDetect);
        });
        setAddedElements(true);
    }, [setAddedElements]);

    useEffect(() => {
        if (!addedElements) {
            return;
        }
        TailwindCSSBreaks.forEach(bp => {
            const { size } = bp;
            const breakDetect =
                document.getElementById(`${size}-breakpoint-detect`);
            if (!breakDetect) {
                return;
            }
            if (breakDetect.clientWidth) {
                setBreakpoint(size);
            }
            // document.body.removeChild<HTMLElement>(breakDetect);
        })
    }, [addedElements]);

    return breakpoint;
};

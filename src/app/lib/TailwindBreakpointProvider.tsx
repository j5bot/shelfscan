import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useLayoutEffect,
    useState
} from 'react';

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

const TailwindBreakpointContext =
    createContext<TailwindCSSBreakId | undefined>(TailwindCSSBreakIds.mobile);

type Props = {
    children: ReactNode;
};

export const TailwindBreakpointProvider = ({ children }: Props) => {
    const breakpoint = useTailwindBreakpointDetect();

    return <>
        <div className="w-2 h-2 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0 absolute top-0 left-0"
             id="mobile-breakpoint-detect" />
        <div className="w-0 h-0 sm:w-2 sm:h-2 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0 absolute top-0 left-0"
             id="sm-breakpoint-detect" />
        <div className="w-0 h-0 sm:w-0 sm:h-0 md:w-2 md:h-2 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0 absolute top-0 left-0"
             id="md-breakpoint-detect" />
        <div className="w-0 h-0 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-2 lg:h-2 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0 absolute top-0 left-0"
             id="lg-breakpoint-detect" />
        <div className="w-0 h-0 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-2 xl:h-2 2xl:w-0 2xl:h-0 absolute top-0 left-0"
             id="xl-breakpoint-detect" />
        <div className="w-0 h-0 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-2 2xl:h-2 absolute top-0 left-0"
             id="2xl-breakpoint-detect" />
        <TailwindBreakpointContext.Provider value={breakpoint}>
            {children}
        </TailwindBreakpointContext.Provider>
    </>;
};

// const breakpointDetectElementIds = Object.values(TailwindCSSBreakIds)
//     .map(id => `${id}-breakpoint-detect`);

export const useTailwindBreakpoint = () => useContext(TailwindBreakpointContext);

export const useTailwindBreakpointDetect = () => {
    const [breakpoint, setBreakpoint] = useState<TailwindCSSBreakId>();
    const [addedElements, setAddedElements] = useState<boolean>(false);

    // let timeout: number;

    const checkBreakpoint = () => {
        // const elementNotFound = breakpointDetectElementIds
        //     .some(elementId => !document.getElementById(elementId));
        //
        // if (elementNotFound) {
        //     if (!timeout) {
        //         timeout = window.setTimeout(checkBreakpoint, 100);
        //     }
        //     return;
        // }

        TailwindCSSBreaks.forEach(bp => {
            const { size } = bp;
            const breakDetect =
                document.getElementById(`${size}-breakpoint-detect`);
            if (!breakDetect) {
                return;
            }

            if (breakDetect.clientWidth) {
                document.body.classList.add(size);
                setBreakpoint(size);
            } else {
                document.body.classList.remove(size);
            }
        });
    };

    useEffect(() => {
        if (addedElements) {
            return;
        }
        TailwindCSSBreaks.forEach(bp => {
            const { size } = bp;
            const breakDetect = document.createElement('div');
            const className = TailwindCSSBreaks.map(innerBp => {
                const cssPrefix = !innerBp.prefix ? '' : `${innerBp.size}:`;
                return innerBp.size === size ? `${cssPrefix}w-2 ${cssPrefix}h-2` : `${cssPrefix}w-0 ${cssPrefix}h-0`;
            }).join(' ');
            breakDetect.className = `${className} absolute top-0 left-0`;
            breakDetect.id = `${size}-breakpoint-detect`;
            document.body.appendChild(breakDetect);
        });
        setAddedElements(true);
    }, [addedElements, setAddedElements]);

    useLayoutEffect(() => {
        if (!addedElements) {
            return;
        }
        checkBreakpoint();
        // window.addEventListener('resize', checkBreakpoint);
        //
        // return () => window.removeEventListener('resize', checkBreakpoint);
    }, [addedElements]);

    return breakpoint;
};

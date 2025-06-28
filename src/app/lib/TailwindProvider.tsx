import React, {
    createContext,
    ReactNode,
    useContext,
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
const TailwindDarkModeContext =
    createContext<boolean>(false);

type Props = {
    children: ReactNode;
};

export const TailwindProvider = ({ children }: Props) => {
    const breakpoint = useTailwindBreakpointDetect();
    const darkMode = useTailwindDarkModeDetect();

    return <>
        <div className="w-0 h-0 dark:w-2 dark:h-2 absolute top-0 left-0"
             id="darkmode-detect" />
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
            <TailwindDarkModeContext.Provider value={darkMode}>
                {children}
            </TailwindDarkModeContext.Provider>
        </TailwindBreakpointContext.Provider>
    </>;
};

export const useTailwindBreakpoint = () => useContext(TailwindBreakpointContext);
export const useTailwindDarkMode = () => useContext(TailwindDarkModeContext);

export const useTailwindBreakpointDetect = () => {
    const [breakpoint, setBreakpoint] = useState<TailwindCSSBreakId>();

    const checkBreakpoint = () => {
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

    useLayoutEffect(() => {
        checkBreakpoint();
    }, []);

    return breakpoint;
};

export const useTailwindDarkModeDetect = () => {
    const [darkMode, setDarkMode] = useState<boolean>(false);

    const checkDarkMode = () => {
        const darkModeDetect =
            document.getElementById(`darkmode-detect`);
        if (!darkModeDetect) {
            return;
        }

        if (darkModeDetect.clientWidth) {
            document.body.classList.add('dark-mode');
            setDarkMode(true);
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    useLayoutEffect(() => {
        checkDarkMode();
    }, []);

    return darkMode;
};

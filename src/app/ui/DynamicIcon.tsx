import loadable from '@loadable/component';
import React, { useEffect, useState, ReactNode, SVGAttributes } from 'react';

type ImportFn = Parameters<typeof loadable>[0];

const IconLibraryImportMap: Record<string, Parameters<typeof loadable>[0]> = {
    ai: (() => import('react-icons/ai') as unknown) as ImportFn,
    bs: (() => import('react-icons/bs') as unknown) as ImportFn,
    bi: (() => import('react-icons/bi') as unknown) as ImportFn,
    ci: (() => import('react-icons/ci') as unknown) as ImportFn,
    cg: (() => import('react-icons/cg') as unknown) as ImportFn,
    di: (() => import('react-icons/di') as unknown) as ImportFn,
    fi: (() => import('react-icons/fi') as unknown) as ImportFn,
    fc: (() => import('react-icons/fc') as unknown) as ImportFn,
    fa: (() => import('react-icons/fa') as unknown) as ImportFn,
    fa6: (() => import('react-icons/fa6') as unknown) as ImportFn,
    gi: (() => import('react-icons/gi') as unknown) as ImportFn,
    go: (() => import('react-icons/go') as unknown) as ImportFn,
    gr: (() => import('react-icons/gr') as unknown) as ImportFn,
    hi: (() => import('react-icons/hi') as unknown) as ImportFn,
    hi2: (() => import('react-icons/hi2') as unknown) as ImportFn,
    im: (() => import('react-icons/im') as unknown) as ImportFn,
    lia: (() => import('react-icons/lia') as unknown) as ImportFn,
    io: (() => import('react-icons/io') as unknown) as ImportFn,
    io5: (() => import('react-icons/io5') as unknown) as ImportFn,
    lu: (() => import('react-icons/lu') as unknown) as ImportFn,
    md: (() => import('react-icons/md') as unknown) as ImportFn,
    pi: (() => import('react-icons/pi') as unknown) as ImportFn,
    rx: (() => import('react-icons/rx') as unknown) as ImportFn,
    ri: (() => import('react-icons/ri') as unknown) as ImportFn,
    si: (() => import('react-icons/si') as unknown) as ImportFn,
    sl: (() => import('react-icons/sl') as unknown) as ImportFn,
    tb: (() => import('react-icons/tb') as unknown) as ImportFn,
    tfi: (() => import('react-icons/tfi') as unknown) as ImportFn,
    ti: (() => import('react-icons/ti') as unknown) as ImportFn,
    vsc: (() => import('react-icons/vsc') as unknown) as ImportFn,
    wi: (() => import('react-icons/wi') as unknown) as ImportFn,
};

export const DynamicIcon = <T extends SVGAttributes<unknown> & {
    icon: string; size: number;
}>(props: T) => {
    const [libraryOrViewBox, iconNameOrPath] = props.icon.split('/');

    // we assume this is an SVG viewBox/path if library isn't mapped
    return IconLibraryImportMap[libraryOrViewBox] ?
           <DynamicReactIcon {...props} /> :
           <DynamicSvgIcon
               path={iconNameOrPath}
               viewBox={libraryOrViewBox}
               className={props.className}
               size={props.size}
               fill="currentColor"
           />;
};

export const DynamicSvgIcon = (props: SVGAttributes<unknown> & {
    path: string;
    size: number;
}) => {
    const { path, size, ...svgProps} = props;
    return <svg xmlns="http://www.w3.org/2000/svg" {...svgProps} height={size} width={size}>
        <path
            d={path}
        />
    </svg>;
};

export const DynamicReactIcon = <T extends { icon: string; }>(props: T) => {
    const [iconNode, setIconNode] = useState<ReactNode>(null);
    const [library, iconName] = props.icon.split('/');

    const importFn = IconLibraryImportMap[library];

    useEffect(() => {
        const loadIcon = async () => {
            try {
                const Component = loadable(
                    importFn,
                    {
                        resolveComponent: (imported) => imported[iconName as keyof typeof imported],
                    },
                );

                setIconNode(<Component {...props} />);
            } catch (error) {
                console.error(`Error loading icon ${iconName} from ${library}:`, error);
                setIconNode(null);
            }
        };

        if (iconName && library) {
            loadIcon().then();
        } else {
            setIconNode(null);
        }
    }, [iconName, library]);

    return iconNode;
};

import { usePathname } from 'next/navigation';

export const useMode = () => {
    const pathname = usePathname();

    return {
        swap: pathname.startsWith('/swap'),
        swapScan: pathname.startsWith('/swapscan'),
    };
};

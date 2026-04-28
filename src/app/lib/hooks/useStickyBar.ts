import { RefObject, useEffect, useRef, useState } from 'react';

type UseStickyBarResult = {
    sentinelRef: RefObject<HTMLDivElement | null>;
    sectionRef: RefObject<HTMLElement | null>;
    stickyTop: number;
};

export const useStickyBar = (active: boolean): UseStickyBarResult => {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const [stickyTop, setStickyTop] = useState<number>(0);

    useEffect(() => {
        if (!active) { return; }
        const sentinel = sentinelRef.current;
        const section = sectionRef.current;
        if (!sentinel || !section) { return; }
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                setStickyTop(section.getBoundingClientRect().top > 0
                    ? section.getBoundingClientRect().top
                    : 0);
            } else {
                setStickyTop(0);
            }
        }, { threshold: 0 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [active]);

    return { sentinelRef, sectionRef, stickyTop };
};

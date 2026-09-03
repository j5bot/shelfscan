import Link from 'next/link';

export const SubscribeBanner = () => {
    return <Link
        id="subscribe-banner"
        href="/subscribe/"
        className="hidden opacity-0 fixed top-0 right-0 z-50 overflow-hidden w-80 h-32 pointer-events-none"
        aria-label="$2 per year special - subscribe now"
    >
        <span className={`absolute top-7.5 -right-30 w-100
            rotate-32 text-center py-1
            bg-[#9b7ede] text-white text-xs font-bold uppercase tracking-wide
            shadow-md pointer-events-auto`}>
            $2 Special!
        </span>
    </Link>;
};

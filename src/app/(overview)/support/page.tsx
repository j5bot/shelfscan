'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';

const SupportPage = () => {
    useTitle('ShelfScan | Support');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">Support</h1>

                <p className="px-5">I provide the following areas for communication about and support of ShelfScan:</p>

                <ul className="list list-disc px-10">
                    <li>
                        <Link href="https://www.youtube.com/watch?v=oMYqzivNqEY"
                              className="underline" target="_blank">YouTube Tutorials & Videos</Link>
                    </li>
                    <li>
                        <Link href="https://www.facebook.com/groups/1371928150537745/"
                              className="underline" target="_blank">Facebook Group</Link>
                    </li>
                    <li>
                        <Link href="https://boardgamegeek.com/blog/16520"
                              className="underline" target="_blank">ShelfScan News BGG Blog</Link>
                    </li>
                    <li>
                        <Link href="https://boardgamegeek.com/guild/4697"
                              className="underline" target="_blank">ShelfScan BGG Guild</Link>
                    </li>
                    <li>
                        <Link href="https://discord.com/channels/1500537089517944973/1546134734554533889"
                              className="underline" target="_blank">ShelfScan Support Discord</Link> (
                        <Link href="https://discord.gg/HHzQRYVUwd"
                              className="underline" target="_blank">Discord Invite</Link>)
                    </li>
                    <li>
                        Email support@[domain]
                    </li>
                </ul>


            </div>
        </div>
    </>;
};

export default SupportPage;

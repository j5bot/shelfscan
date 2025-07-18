import {
    addImageDataToCache,
    getImageDataFromCache,
    makeImageCacheId
} from '@/app/lib/database/cacheDatabase';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useImagePropsWithCache } from '@/app/lib/hooks/useImagePropsWithCache';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { RootState } from '@/app/lib/redux/store';
import { Settings } from '@/app/ui/Settings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useRef, useState } from 'react';
import { FaQuestionCircle, FaSignOutAlt } from 'react-icons/fa';
import { FaBarcode, FaBars, FaGear, FaNewspaper } from 'react-icons/fa6';

const closeOnNavigate = () => {
    document.getElementById('nav-drawer')?.click?.()
};

export const NavDrawer = () => {
    const dispatch = useDispatch();

    const [dialogContent, setDialogContent] = useState<ReactNode>(null);

    const router = useRouter();
    const user = useSelector((state: RootState)=> state.bgg.user);

    const dialogRef = useRef<HTMLDialogElement>(null);

    const {
        user: username,
        firstName,
        lastName,
        avatarUrl: baseAvatarUrl,
    } = user;

    let avatarUrl: string;
    switch (true) {
        case !baseAvatarUrl || baseAvatarUrl === 'N/A':
            avatarUrl = '/images/no-avatar.png';
            break;
        default:
            avatarUrl = baseAvatarUrl;
            break;
    }

    const nameSegments = [];
    if (firstName?.length) {
        nameSegments.push(firstName);
    }
    if (lastName?.length) {
        nameSegments.push(lastName);
    }
    const name = nameSegments.join(' ');

    const { src, alt, ...imageProps } = useImagePropsWithCache({
        src: avatarUrl,
        alt: username as string,
        height: 64,
        width: 64,
        getImageId: makeImageCacheId,
        getImageDataFromCache,
        addImageDataToCache,
    }, [username]);

    const signOutHandler = () => {
        dispatch(setBggUser());
    };

    const signOutMenuItem = username ? <li>
        <label htmlFor="nav-drawer" onClick={() => {
            signOutHandler();
            closeOnNavigate();
        }}><FaSignOutAlt className="inline" /> Sign Out</label>
    </li> : null;

    return (<>
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box min-w-86">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-4">✕</button>
                </form>
                {dialogContent}
            </div>
        </dialog>
        <div className="drawer drawer-end">
            <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content absolute top-4 right-5">
                <label htmlFor="nav-drawer" className="drawer-button"><FaBars /></label>
            </div>
            <div className="drawer-side z-[100]">
                <label htmlFor="nav-drawer" aria-label="close sidebar" className="drawer-overlay" />
                <div className="bg-overlay bg-base-200 min-h-full w-1/2 md:w-80 p-2 mr-0">
                    {username && <div className="flex flex-wrap gap-2 p-2">
                        <img className="bg-orange-200 rounded-full border-gray-400 border-4" src={src} alt={alt} {...imageProps} />
                        <div className="">
                            <div>{username}</div>
                            <div className="text-xs">{name}</div>
                        </div>
                    </div>}
                    <ul className="w-full list-none menu text-base-content p-0 pt-2 pb-2">
                        <li className="w-full flex flex-row">
                            <Link className="flex gap-2 grow" href="/" onNavigate={closeOnNavigate}>
                                <FaBarcode className="inline" /> Scan
                            </Link>
                            {!username && <button className="cursor-pointer flex gap-2" onClick={() => {
                                closeOnNavigate();
                                router.push('/?scanner-tour=true');
                            }}><FaQuestionCircle /> Tour</button>}
                        </li>
                    </ul>
                    <ul className="w-full list-none menu text-base-content p-0 pt-2 border-t-gray-300 border-t-1">
                        <li className="w-full flex flex-row">
                            <Link className="flex gap-2 grow" href="https://boardgamegeek.com/blog/16520/shelfscan-news"
                                  target="_blank" onNavigate={closeOnNavigate}>
                                <FaNewspaper className="inline" /> Blog
                            </Link>
                        </li>
                        <li className="w-full flex flex-row mt-6">
                            <div className="flex gap-2 grow"
                                 onClick={() => {
                                     setDialogContent(<>
                                        <h2 className="m-0">Settings</h2>
                                        <Settings />
                                     </>);
                                     dialogRef.current?.showModal();
                                 }}>
                                <FaGear className="inline" /> Settings
                            </div>
                        </li>
                        {signOutMenuItem}
                    </ul>
                </div>
            </div>
        </div>
    </>);
}
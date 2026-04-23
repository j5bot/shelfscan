import {
    addImageDataToCache,
    getImageDataFromCache,
    makeImageCacheId
} from '@/app/lib/database/cacheDatabase';
import { removeSetting } from '@/app/lib/database/database';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useBatchSync } from '@/app/lib/extension/useBatchSync';
import { useImagePropsWithCache } from '@/app/lib/hooks/useImagePropsWithCache';
import { useLoadUser } from '@/app/lib/hooks/useLoadUser';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { RootState } from '@/app/lib/redux/store';
import { useSettings } from '@/app/lib/SettingsProvider';
import { Settings } from '@/app/ui/Settings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, Suspense, use, useRef, useState } from 'react';
import { FaSignOutAlt, FaSync } from 'react-icons/fa';
import { FaBarcode, FaBars, FaGear, FaGlobe, FaLayerGroup, FaList, FaNewspaper, FaTableList } from 'react-icons/fa6';
import { MdQuestionAnswer, MdTour } from 'react-icons/md';

import { type ResolvedImageProps } from '@/app/lib/hooks/useImagePropsWithCache';

type AvatarProps = {
    avatarUrl: string;
    username: string;
};

const AvatarInner = ({ promise }: { promise: Promise<ResolvedImageProps> }) => {
    const { src, alt, ...imageProps } = use(promise);
    return <img className="bg-[#d9d4e6] rounded-full border-gray-400 border-4" src={src} alt={alt} {...imageProps} />;
};

const Avatar = ({ avatarUrl, username }: AvatarProps) => {
    const promise = useImagePropsWithCache({
        src: avatarUrl,
        alt: username,
        height: 64,
        width: 64,
        getImageId: makeImageCacheId,
        getImageDataFromCache,
        addImageDataToCache,
    }, [username]);
    return (
        <Suspense fallback={<div className="bg-[#d9d4e6] rounded-full border-gray-400 border-4 w-16 h-16" />}>
            <AvatarInner promise={promise} />
        </Suspense>
    );
};

const closeOnNavigate = () => {
    document.getElementById('nav-drawer')?.click?.()
};

export const NavDrawer = () => {
    const dispatch = useDispatch();
    const { loadSettings, settings } = useSettings();
    const { username: settingsUsername, rememberMe } = settings;
    const { isPending: refreshCollectionPending, loadUser } = useLoadUser();
    const { canBatch } = useBatchSync();

    const [dialogContent, setDialogContent] = useState<ReactNode>(null);

    const router = useRouter();
    const user = useSelector((state: RootState) => state.bgg.user);

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

    const signOutHandler = () => {
        dispatch(setBggUser());
        removeSetting('username').then();
        loadSettings().then();
    };

    const refreshCollectionHandler = () => {
        if (!(username && settingsUsername)) {
            return;
        }
        loadUser(settingsUsername as string, rememberMe as boolean, false);
    };

    const signOutMenuItem = username ? <li>
        <label htmlFor="nav-drawer" onClick={() => {
            signOutHandler();
            closeOnNavigate();
        }}><FaSignOutAlt className="inline" /> Sign Out</label>
    </li> : null;

    const refreshCollectionItem = (settingsUsername || username) ? <li>
        <label htmlFor="nav-drawer" onClick={() => {
            if (refreshCollectionPending) {
                return;
            }
            refreshCollectionHandler();
            closeOnNavigate();
        }}><FaSync className={`inline ${refreshCollectionPending ? 'animate-spin' : ''}`} /> Refresh Collection </label>
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
                <label htmlFor="nav-drawer" className="drawer-button"><FaBars className="w-5.5 h-5.5" /></label>
            </div>
            <div className="drawer-side z-[100]">
                <label htmlFor="nav-drawer" aria-label="close sidebar" className="drawer-overlay" />
                <div className="bg-overlay bg-base-200 min-h-full w-1/2 md:w-80 p-2 mr-0">
                    {username && <div className="flex flex-wrap gap-2 p-2">
                        <Avatar avatarUrl={avatarUrl} username={username as string} />
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
                            }}><MdTour /> Tour</button>}
                        </li>
                        {canBatch && <li className="w-full">
                            <Link className="flex gap-2 grow" href="/batch" onNavigate={closeOnNavigate}>
                                <FaLayerGroup className="inline" /> Batch Scan
                            </Link>
                        </li>}
                        {refreshCollectionItem}
                        <li className="w-full">
                            <Link className="flex gap-2 grow" href="/collection" onNavigate={closeOnNavigate}>
                                <FaList className="inline" /> Collection
                            </Link>
                        </li>
                    </ul>
                    <ul className="w-full list-none menu text-base-content p-0 pt-2 border-t-gray-300 border-t-1">
                        <li className="w-full">
                            <Link className="flex gap-2 grow" href="/extension/" onNavigate={closeOnNavigate}>
                                <FaGlobe className="inline" /> Extension
                            </Link>
                        </li>
                        <li className="w-full">
                            <Link className="flex gap-2 grow" href="/about/" onNavigate={closeOnNavigate}>
                                <MdQuestionAnswer className="inline" /> About
                            </Link>
                        </li>
                        <li className="w-full">
                            <Link className="flex gap-2 grow" href="https://boardgamegeek.com/blog/16520/shelfscan-news"
                                  target="_blank" onNavigate={closeOnNavigate}>
                                <FaNewspaper className="inline" /> Blog
                            </Link>
                        </li>
                        <li className="w-full">
                            <Link className="flex gap-2 grow" href="/data-builder/" onNavigate={closeOnNavigate}>
                                <FaTableList className="inline" /> Data Builder
                            </Link>
                        </li>
                        <li className="w-full mt-6">
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
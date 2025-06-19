import {
    addImageDataToCache,
    getImageDataFromCache,
    makeImageCacheId
} from '@/app/lib/database/cacheDatabase';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { useImagePropsWithCache } from '@/app/lib/hooks/useImagePropsWithCache';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { RootState } from '@/app/lib/redux/store';
import Link from 'next/link';
import { FaSignOutAlt } from 'react-icons/fa';
import { FaBarcode, FaBars } from 'react-icons/fa6';

const closeOnNavigate = () => {
    document.getElementById('nav-drawer')?.click?.()
};

export const NavDrawer = () => {
    const dispatch = useDispatch();

    const user = useSelector((state: RootState)=> state.bgg.user);

    const {
        user: username,
        firstName,
        lastName,
        avatarUrl,
    } = user;

    const nameSegments = [];
    if (firstName?.length) {
        nameSegments.push(firstName);
    }
    if (lastName?.length) {
        nameSegments.push(lastName);
    }
    const name = nameSegments.join(' ');

    const { src, alt, ...imageProps } = useImagePropsWithCache({
        src: avatarUrl as string,
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

    return <div className="drawer drawer-end">
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
                <ul className="list-none menu text-base-content p-0 pt-2">
                    <li>
                        <Link href="/" onNavigate={closeOnNavigate}>
                            <FaBarcode className="inline" /> Scan
                        </Link>
                    </li>
                    {signOutMenuItem}
                </ul>
            </div>
        </div>
    </div>;
}
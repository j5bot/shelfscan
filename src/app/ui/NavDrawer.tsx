import { useDispatch, useSelector } from '@/app/lib/hooks';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { RootState } from '@/app/lib/redux/store';
import Link from 'next/link';
import { FaSignOutAlt } from 'react-icons/fa';
import { FaBarcode, FaBars } from 'react-icons/fa6';

export const NavDrawer = () => {
    const dispatch = useDispatch();

    const username = useSelector((state: RootState)=> state.bgg.user?.user);

    const signOutHandler = () => {
        dispatch(setBggUser());
    };

    const signOutMenuItem = username ? <li>
        <label htmlFor="nav-drawer" onClick={signOutHandler}><FaSignOutAlt className="inline" /> Sign Out</label>
    </li> : null;

    return <div className="drawer drawer-end bg-white">
        <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content absolute top-4 right-5">
            <label htmlFor="nav-drawer" className="drawer-button"><FaBars /></label>
        </div>
        <div className="drawer-side z-[100]">
            <label htmlFor="nav-drawer" aria-label="close sidebar" className="drawer-overlay" />
            <ul className="menu bg-overlay text-base-content min-h-full w-1/2 md:w-80 p-2">
                <li>
                    <Link href="/">
                        <label htmlFor="nav-drawer"><FaBarcode className="inline" /> Scan</label>
                    </Link>
                </li>
                {signOutMenuItem}
            </ul>
        </div>
    </div>;
}
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

export const DetailedPlayForm = () => {
    const [location, setLocation] = useState<string>();
    const [locations, setLocations] = useState<string[]>([]);

    return <form name="plays">
        <div className="flex gap-1 items-center">
            <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-xs"><FaSearch /></div>
                <ul tabIndex={0} className="dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                    <li>Location 1</li>
                    <li>Location 2</li>
                </ul>
            </div>
            <input type="text" className="input text-sm h-7 pl-1.5 pt-1 pb-1" placeholder="Location" value={location} />
        </div>
        <div>
            <label>Players</label>
        </div>
    </form>;
};

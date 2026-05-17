import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { BggLocations, BggPlayer } from '@/app/lib/types/bgg';
import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';

export const DetailedPlayForm = () => {
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const [location, setLocation] = useState<string>();
    const [locations, setLocations] = useState<string[]>([]);
    const [players, setPlayers] = useState<(BggPlayer | string)[]>([]);
    const [allPlayers, setAllPlayers] = useState<BggPlayer[]>([]);

    useEffect(() => {
        let active = true;

        dispatchExtensionMessage({ type: 'getPlayers' })?.then(message => {
            if (!active) {
                return;
            }
            setAllPlayers(message?.response as BggPlayer[] ?? []);
        });

        dispatchExtensionMessage({ type: 'getLocations' })?.then(message => {
            if (!active) {
                return;
            }
            setLocations((message?.response as BggLocations)?.locations
                .map(location => location.location) ?? []);
        });

        return () => {
            active = false;
        };
    }, []);

    return <form name="plays">
        <div className="flex gap-1 items-center">
            <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-xs"><FaSearch /></div>
                <ul tabIndex={0} className="dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                    {locations.map((location, index) => <li key={index}>{location}</li>)}
                </ul>
            </div>
            <input type="text" className="input text-sm h-7 pl-1.5 pt-1 pb-1" placeholder="Location" value={location} />
        </div>
        <div>
            <label>Players</label>
        </div>
    </form>;
};

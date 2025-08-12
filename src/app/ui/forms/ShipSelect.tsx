import { SetFormValue } from '@/app/lib/extension/types';
import { useEffect, useState } from 'react';

const shipLocations = [
    { value: '', label: 'Ship Location' },
    { value: 'usonly', label: 'US Only' },
    { value: 'worldwide', label: 'Worldwide' },
    { value: 'usandothers', label: 'US and Others' },
];

const shipAreasOptions = [
    { value: 'usa', label: 'USA' },
    { value: 'canada', label: 'Canada' },
    { value: 'eu', label: 'Europe' },
    { value: 'europe', label: 'European Union' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'australasia', label: 'Australasia' },
    { value: 'southamerica', label: 'South America' },
    { value: 'africa', label: 'Africa' },
    { value: 'mexico', label: 'Mexico' },
    { value: 'middleeast', label: 'Middle East' },
    { value: 'caribbean', label: 'Caribbean' },
];

export const ShipSelect = (
    { shipLocation, shipAreas, setValue }: {
        shipLocation: string;
        shipAreas: string[] | undefined;
        setValue: SetFormValue;
    }
) => {
    const [shipLocationValue, setShipLocationValue] = useState<string>(shipLocation);
    const [shipAreasValue, setShipAreasValue] =
        useState<string[] | undefined>(shipAreas);

    useEffect(() => {
        setShipLocationValue(shipLocation);
    }, [shipLocation]);

    useEffect(() => {
        setShipAreasValue(shipAreas);
    }, [shipAreas]);

    return <>
        <select name="shipLocation"
                className="grow select select-sm select-condensed h-7 pl-1.5 p-1 pr-0"
                value={shipLocationValue}
                onChange={event => {
                    setValue('shipLocation', event.currentTarget.value);
                    setShipLocationValue(event.currentTarget.value);
                }}
        >
            {shipLocations.map(location =>
                <option key={location.value}
                        value={location.value}>{location.label}</option>
            )}
        </select>
        {shipLocationValue === 'usandothers' &&
            <>
                <input type="hidden" name="shipAreas"
                       value={shipAreasValue?.join(',')} />
                <select multiple={true}
                        className="select select-condensed text-xs w-full input h-15 ios-safari:h-6 p-1 pl-1.5"
                        value={shipAreasValue}
                        onChange={event => {
                            const values = Array.from(event.currentTarget
                                .selectedOptions)?.map(option => option.value);
                            setShipAreasValue(values);
                            setValue('shipAreas', values.join(','));
                        }}
                 >
                     {shipAreasOptions.map(shipArea =>
                        <option key={shipArea.value}
                                value={shipArea.value}>{shipArea.label}</option>
                     )}
                 </select>
            </>
        }
    </>;
};
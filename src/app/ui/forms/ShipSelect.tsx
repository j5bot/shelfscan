import { SetFormValue } from '@/app/lib/extension/types';
import { useState } from "react";

const shipLocations = [
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


    return <>
        <select name="shipLocation"
                className="select select-sm h-7 pl-1.5 p-1 pr-0"
                defaultValue={shipLocationValue}
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
                        className="text-xs w-full input h-15 p-1"
                        defaultValue={shipAreasValue}
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
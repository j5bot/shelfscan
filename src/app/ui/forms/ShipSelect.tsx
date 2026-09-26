import { SetFormValue } from '@/app/lib/extension/types';
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
    props: {
        id?: string;
        shipLocation: string;
        shipAreas: string[] | undefined;
        setValue: SetFormValue;
    }
) => {
    const { id, shipLocation, shipAreas, setValue } = props;

    const shipAreasKey = shipAreas?.join(',');

    // the selects own the pending choice (saving can be async); keying by the
    // saved value resets them whenever that value changes
    return <>
        <select key={shipLocation}
                id={id}
                name="shipLocation"
                aria-label="Ship location"
                className="grow select select-sm select-condensed h-7 pl-1.5 p-1 pr-0"
                defaultValue={shipLocation}
                onChange={event => {
                    setValue('shipLocation', event.currentTarget.value);
                }}
        >
            {shipLocations.map(location =>
                <option key={location.value}
                        value={location.value}>{location.label}</option>
            )}
        </select>
        {shipLocation === 'usandothers' &&
            <>
                <input type="hidden" name="shipAreas"
                       value={shipAreasKey} />
                <select key={shipAreasKey}
                        multiple={true}
                        aria-label="Ship areas"
                        className="select select-condensed text-xs w-full input h-15 ios-safari:h-6 p-1 pl-1.5"
                        defaultValue={shipAreas}
                        onChange={event => {
                            const values = Array.from(event.currentTarget
                                .selectedOptions)?.map(option => option.value);
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
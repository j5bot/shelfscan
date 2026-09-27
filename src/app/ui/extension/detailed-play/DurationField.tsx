type DurationOption = { label: string; value: string };

const DurationOptions: DurationOption[] = [
    { label: '30 min', value: '30' },
    { label: '1 hr', value: '60' },
    { label: '2 hr', value: '120' },
    { label: '3 hr', value: '180' },
    { label: 'Other', value: 'other' },
];

type DurationFieldProps = {
    id: string;
    duration: string;
    customDuration: string;
    /** minutes submitted with the play (the preset, or the custom value for "Other") */
    durationMinutes: string;
    onDurationChange: (value: string) => void;
    onCustomDurationChange: (value: string) => void;
};

export const DurationField = (props: DurationFieldProps) => {
    const {
        id,
        duration,
        customDuration,
        durationMinutes,
        onDurationChange,
        onCustomDurationChange,
    } = props;

    return <div className="flex items-center gap-1.5">
        <label className="w-16 shrink-0" htmlFor={id}>Duration</label>
        {/* read by the add-play FormData */}
        <input type="hidden" name="duration" value={durationMinutes} />
        <select
            id={id}
            className="select select-xs text-xs flex-1 min-w-0 pl-2"
            value={duration}
            onChange={e => onDurationChange(e.currentTarget.value)}
        >
            <option value="">—</option>
            {DurationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {duration === 'other' && (
            <input
                type="number"
                min={1}
                placeholder="Mins."
                value={customDuration}
                className="input input-xs text-xs w-16"
                onChange={e => onCustomDurationChange(e.currentTarget.value)}
            />
        )}
    </div>;
};

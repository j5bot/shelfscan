import { cycleThreeState } from '@/app/lib/hooks/useCollectionFilters';
import { ReactNode } from 'react';
import { FaXmark } from 'react-icons/fa6';

export type ThreeStateToggleProps<S extends string> = {
    id?: string;
    value: S;
    states: readonly [S, S, S]; // [default, on, off]
    onLabel: string;
    offLabel: string;
    icon: ReactNode;
    onChange: (next: S) => void;
    title?: string;
};

const getToggleLabel = (isDefault: boolean, isOn: boolean, labels: { title?: string; onLabel: string; offLabel: string }) => {
    switch (true) {
        case isDefault:
            return labels.title ?? 'Filter';
        case isOn:
            return labels.onLabel;
        default:
            return labels.offLabel;
    }
};

const getToggleColorClass = (isDefault: boolean, isOn: boolean) => {
    switch (true) {
        case isDefault:
            return 'text-base-content/40 bg-[#efefef] dark:bg-gray-700';
        case isOn:
            return 'btn-success text-success-content';
        default:
            return 'btn-error text-error-content';
    }
};

/** Cycles default → on → off; the off state shows the icon struck through. */
export const ThreeStateToggle = <S extends string>(props: ThreeStateToggleProps<S>) => {
    const {
        id,
        value,
        states,
        onLabel,
        offLabel,
        icon,
        onChange,
        title,
    } = props;

    const isDefault = value === states[0];
    const isOn = value === states[1];
    const isOff = value === states[2];
    const label = getToggleLabel(isDefault, isOn, { title, onLabel, offLabel });

    return (
        <button
            id={id}
            type="button"
            className={`btn btn-condensed btn-xs rounded-sm gap-0.5 ${getToggleColorClass(isDefault, isOn)}`}
            title={label}
            aria-label={label}
            aria-pressed={!isDefault}
            onClick={() => onChange(cycleThreeState(value, states))}
        >
            {isOff ? (
                <span className="relative inline-flex">
                    {icon}
                    <FaXmark
                        size={8}
                        className="absolute -bottom-0.5 -right-1"
                        aria-hidden="true"
                    />
                </span>
            ) : icon}
        </button>
    );
};

import { Modes, ModeSetting, ModeSettingFormProps, ModeSettings } from '@/app/lib/extension/types';
import { BggCollectionStatuses } from '@/app/lib/types/bgg';
import { SyntheticEvent } from 'react';
import { FaChevronDown } from 'react-icons/fa6';

type ModeActionBlockProps = {
    modeKey: keyof Modes;
    modeSettings: ModeSettings;
    modeSetting: ModeSetting;
    disabled: boolean;
    statuses: BggCollectionStatuses | undefined;
    update: boolean;
    onAction: (e: SyntheticEvent<HTMLButtonElement>) => void;
    onSelectMode: (mode: Modes[keyof Modes], setting: ModeSetting) => (e: SyntheticEvent<HTMLElement>) => void;
    /** props for the mode's own form, when it has one (e.g. detailed play) */
    formProps: ModeSettingFormProps & { key?: number };
};

/** Split button: the main part runs the current mode's action, the chevron opens a menu of modes. */
export const ModeActionBlock = (props: ModeActionBlockProps) => {
    const {
        modeKey,
        modeSettings,
        modeSetting,
        disabled,
        statuses,
        update,
        onAction,
        onSelectMode,
        formProps,
    } = props;

    const ModeForm = modeSetting.form;
    const { key: formKey, ...modeFormProps } = formProps;

    return <>
        <div data-collapse={`${modeKey}-block`}
             className={`relative z-[9] shrink-0 ${modeSetting.width} mr-0.5`}>
            <div className={`rounded-full border-0 border-brand-background absolute top-0 left-0 xs:h-7 h-8 ${modeSetting.width}`}></div>
            <div className={`collapse xs:min-h-7 min-h-8 rounded-none overflow-visible ${modeSetting.width}`}>
                <input type="checkbox" className="xs:h-7 h-8"
                       aria-label={`Choose ${modeKey} action`} style={{
                    padding: 0,
                }} />
                <button disabled={disabled}
                        aria-label={`Choose ${modeKey} action`}
                        className={`collapse-title
                        absolute right-0 top-0
                        collection-button cursor-pointer rounded-r-full
                        flex items-center
                        bg-[#e07ca4bb] text-white
                        p-1 xs:h-7 h-8 w-4.5`}>
                    <FaChevronDown className="w-2 h-2" />
                </button>
                <button disabled={disabled}
                        className={`collection-button cursor-pointer rounded-l-full
                    absolute top-0 left-0 right-5
                    flex justify-start items-center
                    ${disabled ? 'bg-gray-300' : 'bg-brand-background'}
                    text-white
                    p-1 pl-1.5 xs:h-7 h-8
                    z-40
                    xs:font-stretch-semi-condensed xs:tracking-tight
                    text-sm`}
                        onClick={onAction}
                >
                    {modeSetting.icon}
                    <div className="p-0.5 font-semibold uppercase">
                        {modeSetting.label}
                    </div>
                </button>
                <div className={`collapse-content p-0 min-w-33`}>
                    <div className={`mt-1
                    border border-brand-background rounded-md
                    bg-overlay
                    text-xs leading-5.5`}>
                        <ul className="menu w-full p-0 m-0" data-collapse-key={`${modeKey}-block`}>
                            {Object.entries(modeSettings).map(([key, setting], index, array) => {
                                const mode = key as Modes[keyof Modes];
                                const shouldShow = setting.shouldShow
                                    ? setting.shouldShow(statuses ?? null, update)
                                    : true;
                                if (!shouldShow) {
                                    return null;
                                }
                                return <li key={mode}
                                           className={index < array.length - 1 ? 'border-b border-brand-background/30' : undefined}
                                >
                                    <button type="button"
                                            className="w-full p-1 pl-1.5 text-left cursor-pointer"
                                            onClick={onSelectMode(mode, setting)}
                                    >{setting.listText}</button>
                                </li>;
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        {ModeForm && <ModeForm key={formKey} {...modeFormProps} />}
    </>;
};

import { getSetting, setSetting } from '@/app/lib/database/database';
import { DocumentMessageResponseDetail } from '@/app/lib/extension/messageTypes';
import {
    Modes,
    DisabledModes,
    ModeSetting, ModeSettings, ModeSettingFormProps
} from '@/app/lib/extension/types';
import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useSync } from '@/app/lib/extension/useSync';
import { MakeModeSettings } from '@/app/lib/extension/utils';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import {
    getCollectionInfoByObjectId,
} from '@/app/lib/redux/bgg/collection/selectors';
import { updateNumPlays } from '@/app/lib/redux/bgg/collection/slice';
import { BggCollectionItem, BggPlayer } from '@/app/lib/types/bgg';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import { DataForms } from '@/app/ui/extension/DataForms';
import React, {
    Fragment,
    SyntheticEvent,
    useEffect,
    useState
} from 'react';
import { FaSave } from 'react-icons/fa';
import {
    FaChevronDown,
    FaStar,
} from 'react-icons/fa6';

type UseExtension = {
    info?: GameUPCBggInfo;
    version?: GameUPCBggVersion;
    view?: 'version' | 'collection'
}

export type MakeModeBlockParams = {
    modeKey: keyof Modes;
    defaultMode: Modes[keyof Modes];
    addFn: (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => void;
    formKey?: number;
    setFormKey?: (key: number | ((prev: number) => number)) => void;
    formProps?: Partial<ModeSettingFormProps>;
};

export const useExtension = (params?: UseExtension) => {
    const { info, version, view = 'version' } = params ?? {};
    const { syncOn, userId, currentUsername } = useSync();
    const dispatch = useDispatch();
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const [ratingFormOpen, setRatingFormOpen] = useState<boolean>(false);
    const [newRating, setNewRating] = useState<number>(-1);
    const [modes, setModes] = useState<Modes>({ collection: 'add', play: 'quick' });
    const [disabledModes, setDisabledModes] = useState<DisabledModes>({ collection: false, play: false });
    const [players, setPlayers] = useState<BggPlayer[]>();
    const [update, setUpdate] = useState<boolean>(true);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [detailedPlayKey, setDetailedPlayKey] = useState<number>(0);

    const { collectionId, collection } =
        useSelector((state) =>
            getCollectionInfoByObjectId([state, info?.id]));

    const collectionItem = collection?.items[collectionId];

    const { rating: collectionRating, statuses } = collectionItem ?? {};

    const userRating = newRating >= 0 ? newRating : collectionRating ?? -1;

    const createUpdateModeFn =
        (type: keyof Modes, mode: Modes[keyof Modes], setting: ModeSetting)  =>
            (e: SyntheticEvent<HTMLElement>) => {
                if (userId && collectionItem && setting.message) {
                    setting.message(userId, dispatchExtensionMessage, collectionItem);
                }
                return updateModes(e, Object.assign({}, modes, { [type]: mode }));
            };

    const addToCollection = (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document
            .forms.namedItem(modes.collection);
        const formData = form ? new FormData(form) : undefined;
        if (modeSetting.validator && formData && !modeSetting.validator(formData)) {
            // TODO: handle invalid cases
            return;
        }

        const formEntries = formData ? Object.assign(
            {},
            formValues,
            Object.fromEntries(formData)
        ): formValues;

        dispatchExtensionMessage({
            userId,
            type: modes.collection,
            collectionId: update ? collectionId : undefined,
            name: version?.name ?? info?.name,
            gameId: info?.id,
            versionId: version?.version_id,
            formValues: formEntries,
        });

        const target = e.currentTarget.parentElement?.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const addPlay = (_modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document.forms.namedItem(modes.play);
        const formData = form ? new FormData(form) : undefined;

        const dateValue = formData?.get('playdate') as string | undefined;
        let dateString: string;
        if (dateValue) {
            dateString = dateValue;
        } else {
            const d = new Date();
            dateString = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        }

        const formEntries = formData ? Object.assign(
            {},
            formValues,
            Object.fromEntries(formData)
        ): formValues;

        dispatchExtensionMessage({
            userId,
            collectionId,
            type: 'plays',
            name: version?.name ?? info?.name,
            gameId: info?.id,
            versionId: version?.version_id,
            date: dateString,
            playdate: dateString,
            formValues: formEntries,
        })?.then((detail: DocumentMessageResponseDetail | undefined) => {
            if (!detail?.response) {
                return;
            }
            const { response } = detail;
            const { numplays } = (response ?? {}) as { numplays?: number };

            if (numplays != null && collectionId && currentUsername) {
                dispatch(updateNumPlays({
                    username: currentUsername,
                    collectionId,
                    numplays,
                }));
            }
        });

        const target = e.currentTarget.previousElementSibling as HTMLDivElement | null;
        if (target) {
            void target.offsetWidth;
            target.classList.add('add-pulse');
            setTimeout(() => target.classList.remove('add-pulse'), 2500);
        }
    };

    const makeModeBlock = ({
        modeKey,
        defaultMode,
        addFn,
        formKey,
        setFormKey,
        formProps,
    }: MakeModeBlockParams) => {
        const modeSettings =
            MakeModeSettings[modeKey]({
                collectionId: collectionItem?.collectionId,
                update,
                statuses,
                addFn,
            }) as ModeSettings;
        const allowedModes = Object.entries(modeSettings)
            .map(([mode, settings]) => !update ? settings.updateOnly ? undefined : mode : mode)
            .filter(x => x);
        const currentMode = allowedModes.includes(modes[modeKey]) ? modes[modeKey] : defaultMode;
        const modeSetting = modeSettings[currentMode];

        const ModeForm = modeSetting?.form;

        const handleButtonClick = modeSetting.addFn
                                  ? () => setFormKey?.(k => k + 1)
                                  : (e: SyntheticEvent<HTMLButtonElement>) =>
                                      addFn(modeSetting, e);

        return {
            currentMode,
            block: modeSetting && (
                <Fragment key={`${modeKey}-block`}>
                    <div data-collapse={`${modeKey}-block`}
                         className={`relative z-[9] shrink-0 ${modeSetting.width} mr-0.5`}>
                        <div className={`rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 ${modeSetting.width}`}></div>
                        <div className={`collapse xs:min-h-7 min-h-8 rounded-none overflow-visible ${modeSetting.width}`}>
                            <input type="checkbox" className="xs:h-7 h-8" style={{
                                padding: 0,
                            }} />
                            <button disabled={disabledModes[modeKey]}
                                    className={`collapse-title
                                    absolute right-0 top-0
                                    collection-button cursor-pointer rounded-r-full
                                    flex items-center
                                    bg-[#e07ca4bb] text-white
                                    p-1 xs:h-7 h-8 w-4.5`}>
                                <FaChevronDown className="w-2 h-2" />
                            </button>
                            <button disabled={disabledModes[modeKey]}
                                    className={`collection-button cursor-pointer rounded-l-full
                                absolute top-0 left-0 right-5
                                flex justify-start items-center
                                ${disabledModes[modeKey] ? 'bg-gray-300' : 'bg-[#e07ca4]'}
                                text-white
                                p-1 pl-1.5 xs:h-7 h-8
                                z-40
                                xs:font-stretch-semi-condensed xs:tracking-tight
                                text-sm`}
                                    onClick={handleButtonClick}
                            >
                                {modeSetting.icon}
                                <div className="p-0.5 font-semibold uppercase">
                                    {modeSetting.label}
                                </div>
                            </button>
                            <div className={`collapse-content p-0 min-w-33`}>
                                <div className={`mt-1
                                border border-[#e07ca4] rounded-md
                                bg-overlay
                                text-xs leading-5.5`}>
                                    <ul className="menu w-full p-0 m-0" data-collapse-key={`${modeKey}-block`}>
                                        {
                                            Object.entries(modeSettings)
                                                .map(([key, setting], index, array) => {
                                                    const mode = key as Modes[keyof Modes];
                                                    const shouldShow = setting.shouldShow ? setting.shouldShow(
                                                        statuses ?? null,
                                                        update) : true;

                                                    if (!shouldShow) {
                                                        return null;
                                                    }

                                                    return <li key={mode}
                                                               onClick={createUpdateModeFn(modeKey,
                                                                   mode,
                                                                   setting)}
                                                               className={`p-1 pl-1.5 cursor-pointer ${index < array.length - 1 ? 'border-b border-[#e07ca433]' : ''}`.trim()}
                                                    >{setting.listText}</li>
                                                })
                                        }
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    {ModeForm && <ModeForm
                        key={formKey}
                        formValues={formValues}
                        setFormValues={setFormValues}
                        addFn={modeSetting.addFn}
                        {...(formProps ?? {})}
                    />}
                </Fragment>
            ),
        };
    };

    const { currentMode: currentATCMode, block: addToCollectionBlock } = syncOn && userId ? makeModeBlock({
        modeKey: 'collection',
        defaultMode: 'add',
        addFn: addToCollection,
    }) : {};

    const { block: addPlayBlock } = syncOn && userId ? makeModeBlock({
        modeKey: 'play',
        defaultMode: 'quick',
        addFn: addPlay,
        formKey: detailedPlayKey,
        setFormKey: setDetailedPlayKey,
        formProps: { gameName: version?.name ?? info?.name },
    }) : {};

    useEffect(() => {
        if (collectionId) {
            return;
        }
        setUpdate(false);
    }, [collectionId]);

    useEffect(() => {
        if (formValues?.['tradeCondition'] === collectionItem?.tradeCondition) {
            return;
        }
        setFormValues(Object.assign(formValues, {
            tradeCondition: collectionItem?.tradeCondition
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collectionItem?.tradeCondition]);

    useEffect(() => {
        (async () => {
            const extensionModes = await getSetting('extensionModes') as Modes ?? modes
            if (!extensionModes.collection) {
                setModes({ collection: 'add', play: 'quick' });
                return;
            }
            setModes(extensionModes);
        })();

        window.addEventListener('message', (event) => {
            if (!players && event.data.players) {
                setPlayers(event.data.players);
            }
            if (event.data?.type === 'infoLoad-response') {
                const colItem = event.data.response.collectionItem;
                const infoFormValues = [
                    'pricepaid',
                    'pp_currency',
                    'currvalue',
                    'cv_currency',
                    'acquisitiondate',
                    'acquiredfrom',
                    'invdate',
                    'invlocation',
                ].reduce((acc, field) => {
                    return Object.assign(acc, {
                        [field]: colItem?.[field as keyof BggCollectionItem]?.toString() ?? undefined
                    });
                }, formValues);
                infoFormValues.privatecomment = colItem.textfield.privatecomment.value;
                setFormValues(infoFormValues);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (update) {
            setDisabledModes(prev => Object.assign({}, prev, { collection: false }));
            return;
        }

        switch (currentATCMode) {
            case 'previous':
            case 'clear':
                setDisabledModes(prev => Object.assign({}, prev, { collection: true }));
                break;
            default:
                setDisabledModes(prev => Object.assign({}, prev, { collection: false }));
                break;
        }
    }, [update, currentATCMode, setDisabledModes]);

    const updateModes = async (
        event: SyntheticEvent<HTMLElement>,
        modes: Modes
    ) => {
        // close mode collapse
        const collapse = document
            .querySelector(`[data-collapse=${
                event.currentTarget
                    .parentElement?.getAttribute('data-collapse-key')
            }]`);
        (collapse?.querySelector('input[type=checkbox]') as HTMLInputElement | undefined)?.click();

        await setSetting('extensionModes', modes);
        setModes(modes);
    };

    const addRating = (e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document.forms.namedItem(`rating-form-${collectionId ?? info?.id ?? 'unknown'}`);
        const formData = form ? new FormData(form) : undefined;

        dispatchExtensionMessage({
            userId,
            type: 'ratings',
            collectionId,
            name: version?.name ?? info?.name,
            gameId: info?.id,
            versionId: version?.version_id,
            formValues: Object.fromEntries(formData ?? []),
        });

        const target = e.currentTarget?.previousElementSibling as HTMLDivElement;
        if (!target || target.tagName.toLowerCase() !== 'button') {
            return;
        }

        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const toggleRatingForm = () => {
        setRatingFormOpen(!ratingFormOpen);
    };

    const addRatingBlock = syncOn && userId && (
        <Fragment key="arb">
            <div className="flex shrink relative items-center">
                <div className="relative shrink-0 xs:w-17 w-19 xs:h-7 h-8">
                    <button
                        className={`collection-button cursor-pointer rounded-full
                            relative
                            flex justify-start items-center                            
                            bg-[#e07ca4] text-white
                            p-1 pl-1.5  xs:h-7 h-8
                            xs:font-stretch-semi-condensed xs:tracking-tight
                            text-sm`}
                        onClick={toggleRatingForm}
                    >
                        <FaStar className="w-4 h-4" />
                        <div className="p-1 pr-2 font-semibold uppercase">Rate</div>
                    </button>
                </div>
                <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 right-0 xs:h-7 h-8 w-7"></div>
                {ratingFormOpen && newRating > 0 &&
                    <button className={`cursor-pointer relative mr-0.5 xs:h-7 h-8 items-center`}
                            onClick={addRating}>
                        <FaSave className="w-6 h-6 text-[#e07ca4]" />
                    </button>}
            </div>
            {ratingFormOpen && <form name={`rating-form-${collectionId ?? info?.id ?? 'unknown'}`}
                                     className="pt-0.5 pb-2 xs:scale-90 relative xs:-left-2.5">
                <div className="rating rating-sm rating-half">
                    <input type="hidden" className="hidden" name="collectionId" value={collectionId} />
                    {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
                        .map((rating, index, array) => {
                            let bgClassName = 'bg-green-400';

                            switch (true) {
                                case newRating < 3:
                                    bgClassName = 'bg-red-400';
                                    break;
                                case newRating < 4:
                                    bgClassName = 'bg-orange-400';
                                    break;
                                case newRating < 5.5:
                                    bgClassName = 'bg-yellow-400';
                                    break;
                                case newRating < 7:
                                    bgClassName = 'bg-lime-400';
                                    break;
                                default:
                                    break;
                            }

                            return <input key={index} type="radio" name="rating"
                                          className={`mask mask-star-2 ${index % 2 ? 'mask-half-2' : 'mask-half-1'}
                                          ${bgClassName}`} aria-label={rating.toString()}
                                          value={rating}
                                          defaultChecked={userRating >= rating && userRating < (array[index + 1] ?? 11)}
                                          onClick={() => setNewRating(rating)}
                            />
                        })}
                </div>
                <textarea name="comment"
                          className={`mt-2 textarea textarea-sm w-full min-h-8 h-8 text-xs
                            overflow-hidden
                            overflow-ellipsis
                            pl-1.5 pr-1.5
                            focus:h-16 focus:overflow-auto`}
                          placeholder="Comment/Review" />
            </form>}
        </Fragment>
    );

    const settings = syncOn && userId && <div>
        <label className="flex gap-1 justify-start items-center p-2 pl-0.5 text-xs">
            <input disabled={!collectionId}
                   className="toggle toggle-xs checked:bg-[#e07ca4] checked:text-white" type="checkbox"
                   checked={collectionId !== undefined ? update : false} onChange={
                (event) => setUpdate(event.currentTarget.checked)
            } />
            Update in Collection
        </label>
    </div>;

    const primaries = view === 'collection' ? [
        <div key={'atcb'}>{addToCollectionBlock}</div>,
        <div key={'apb'}>{addPlayBlock}</div>,
        <div key={'arb'}>{addRatingBlock}</div>,
    ] : [
        addToCollectionBlock,
        addPlayBlock,
        addRatingBlock,
    ];

    const primaryActions = syncOn && userId ? <>
        {primaries}
    </> : null

    const secondaryActions = syncOn && userId && <DataForms collectionId={collectionId} userId={userId} gameId={info?.id} />;

    return { collectionItem, userId, syncOn, primaryActions, secondaryActions, settings };
};


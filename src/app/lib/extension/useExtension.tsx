import { getSetting, setSetting } from '@/app/lib/database/database';
import { Modes, CollectionModeSettings, DisabledModes } from '@/app/lib/extension/types';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import {
    getCollectionInfoByObjectId,
} from '@/app/lib/redux/bgg/collection/selectors';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { getCollectionItemFromObject } from '@/app/lib/services/bgg/service';
import { BggCollectionStatuses, BGGPlayer } from '@/app/lib/types/bgg';
import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import { AddToMarketForm } from '@/app/ui/extension/AddToMarketForm';
import React, {
    Fragment,
    SyntheticEvent,
    useEffect,
    useLayoutEffect,
    useState
} from 'react';
import { FaSave } from 'react-icons/fa';
import {
    FaChevronDown,
    FaClock,
    FaCloudArrowUp,
    FaDice,
    FaHeart,
    FaPlus,
    FaRecycle,
    FaStar,
    FaTag,
    FaXmark,
} from 'react-icons/fa6';

const makeAddToCollectionModeSettings = (
    collectionId: number | undefined,
    update: boolean,
    statuses?: BggCollectionStatuses,
): CollectionModeSettings =>
    ({
        add: {
            label: update && (statuses?.own || collectionId !== undefined) ? 'Set' : 'Add',
            listText: update ?
                      statuses?.own ? 'Set Info' :
                        collectionId !== undefined ? 'Set as Owned' : 'Add to Owned'
                      : 'Add to Owned',
            icon: update && (statuses?.own || collectionId !== undefined) ?
                  <FaCloudArrowUp className="w-4 h-4 mr-0.5 shrink-0" /> :
                    <FaPlus className="w-4 h-4 shrink-0" />,
            width: 'xs:w-19 w-21',
        },
        trade: {
            label: 'Trade',
            listText: update && (statuses?.fortrade || collectionId !== undefined) ?
                      'Set Trade Info' :
                      'Add for Trade',
            icon: <FaRecycle className="w-3.5 h-4 mr-0.5 shrink-0" />,
            width: 'xs:w-23 w-25',
            form: ({ formValues, setFormValues }) => {
                return <form name="trade" className="pb-2">
                    <input type="text"
                           name="tradeCondition"
                           className="input text-sm p-2"
                           placeholder="Trade Condition"
                           defaultValue={formValues?.['tradeCondition']}
                           onChange={event => setFormValues(
                               Object.assign(formValues, { tradeCondition: event.currentTarget.value })
                           )}
                    />
                </form>;
            },
            validator: (formData: FormData)=> {
                const formValues = Object.fromEntries(formData ?? []);
                return !!(formValues['tradeCondition'] as string | undefined)?.length;
            }
        },
        wishlist: {
            label: 'Wish',
            icon: <FaHeart className="ml-0.5 w-3 h-4 shrink-0" />,
            width: 'xs:w-19.5 w-21.5',
        },
        previous: {
            label: 'Had It',
            listText: 'Previously Owned',
            icon: <FaClock className="w-3.5 h-3.5 mr-0.5 shrink-0" />,
            width: 'xs:w-22.5 w-24.5',
        },
        clear: {
            label: 'Clear',
            listText: 'Clear Statuses',
            icon: <FaXmark className="w-4 h-4 shrink-0" />,
            width: 'xs:w-23 w-25',
            form: () => {
                return <form name="clear" className="self-start xs:self-center xs:pb-2 xs:pt-0 pt-2">
                    <label className="flex flex-wrap gap-1 items-center text-xs">
                        <input name="shouldRemove"
                               value="remove"
                               type="checkbox"
                               className="toggle toggle-xs checked:bg-[#e07ca4] checked:text-white" />
                        Remove
                    </label>
                </form>;
            },
        },
        sell: {
            label: 'Sell',
            icon: <FaTag className="w-4 h-4 mr-0.5 shrink-0" />,
            width: 'xs:w-20.5 w-22.5',
            form: AddToMarketForm,
            validator: (formData: FormData) => {
                const formValues = Object.fromEntries(formData ?? []);
                const required = [
                    'currency', 'price',
                    'condition', 'notes',
                    'paymentMethod',
                    'country', 'shipLocation',
                ];
                if (formValues['shipLocation'] === 'usandothers') {
                    required.push('shipAreas');
                }
                return required.every(field =>
                    !!((formValues[field] as string | undefined))?.length);
            }
        },
    }
    );

export const useExtension = (info?: GameUPCBggInfo, version?: GameUPCBggVersion) => {
    const [syncOn, setSyncOn] = useState<boolean>(false);
    const [ratingFormOpen, setRatingFormOpen] = useState<boolean>(false);
    const [newRating, setNewRating] = useState<number>(-1);
    const [modes, setModes] = useState<Modes>({ collection: 'add', play: 'quick' });
    const [disabledModes, setDisabledModes] = useState<DisabledModes>({ collection: false, play: false });
    const [players, setPlayers] = useState<BGGPlayer[]>();
    const [update, setUpdate] = useState<boolean>(true);
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    const { collectionId, collection } =
        useSelector((state) =>
            getCollectionInfoByObjectId([state, info?.id]));

    const collectionItem = collection?.items[collectionId];

    const userId = useSelector(
        state => state.bgg.user?.id
    );

    const { rating: collectionRating, statuses } = collectionItem ?? {};

    const userRating = newRating >= 0 ? newRating : collectionRating ?? -1;
    const addToCollectionModeSettings =
        makeAddToCollectionModeSettings(collectionItem?.collectionId, update, statuses);
    const atcMode =
        addToCollectionModeSettings[modes.collection ?? 'add'];

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
    }, [collectionItem?.tradeCondition]);

    useEffect(() => {
        (async () => {
            setModes(await getSetting('extensionModes') as Modes ?? modes);
        })();

        window.addEventListener('message', (event) => {
            if (!players && event.data.players) {
                setPlayers(event.data.players);
            }
        });
    }, []);

    useLayoutEffect(() => {
        const newValue = document.body.getAttribute('data-shelfscan-sync') === 'on';
        if (syncOn === newValue) {
            return;
        }
        setSyncOn(newValue);
    }, [info, version]);

    useEffect(() => {
        if (update) {
            setDisabledModes(Object.assign({}, disabledModes, { collection: false }));
            return;
        }

        switch (modes.collection) {
            case 'previous':
            case 'clear':
                setDisabledModes(Object.assign({}, disabledModes, { collection: true }));
                break;
            default:
                setDisabledModes(Object.assign({}, disabledModes, { collection: false }));
                break;
        }
    }, [update, modes.collection, setDisabledModes]);

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
    }

    const addToCollection = (e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document
            .forms.namedItem(modes.collection ?? 'add');
        const formData = form ? new FormData(form) : undefined;
        if (atcMode.validator && formData && !atcMode.validator(formData)) {
            // TODO: handle invalid cases
            return;
        }

        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: modes.collection,
                collectionId: update ? collectionId : undefined,
                name: version?.name ?? info?.name,
                gameId: info?.id,
                versionId: version?.version_id,
                timestamp: Date.now(),
                formValues: Object.fromEntries(formData ?? []),
            },
        });
        document.dispatchEvent(ce);

        const target = e.currentTarget.parentElement?.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const addRating = (e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document.forms.namedItem('rating-form');
        const formData = form ? new FormData(form) : undefined;

        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: 'ratings',
                collectionId,
                name: version?.name ?? info?.name,
                gameId: info?.id,
                versionId: version?.version_id,
                timestamp: Date.now(),
                formValues: Object.fromEntries(formData ?? []),
            },
        });
        document.dispatchEvent(ce);

        const target = e.currentTarget?.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const addPlay = (e: SyntheticEvent<HTMLButtonElement>) => {
        const currentDate = new Date();
        const dateString = `${currentDate.getFullYear()}/${(currentDate.getMonth() + 1) % 12}/${currentDate.getDate()}`;
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: 'plays',
                name: version?.name ?? info?.name,
                gameId: info?.id,
                versionId: version?.version_id,
                timestamp: Date.now(),
                date: dateString,
            },
        });
        document.dispatchEvent(ce);

        const target = e.currentTarget.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const ATCForm = atcMode?.form;

    const addToCollectionBlock = atcMode && syncOn && userId && (
        <Fragment key="atcb">
            <div data-collapse="atcb" className={`relative z-40 shrink-0 ${atcMode.width} mr-0.5`}>
                <div className={`rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 ${atcMode.width}`}></div>
                <div className={`collapse xs:min-h-7 min-h-8 rounded-none overflow-visible ${atcMode.width}`}>
                    <input type="checkbox" className="xs:h-7 h-8" style={{
                        padding: 0,
                    }}/>
                    <button disabled={disabledModes.collection}
                            className={`collapse-title
                                absolute right-0 top-0
                                collection-button cursor-pointer rounded-r-full
                                flex items-center
                                bg-[#e07ca4bb] text-white
                                p-1 xs:h-7 h-8 w-4.5`}>
                        <FaChevronDown className="w-2 h-2" />
                    </button>
                    <button disabled={disabledModes.collection}
                        className={`collection-button cursor-pointer rounded-l-full
                            absolute top-0 left-0 right-5
                            flex justify-start items-center
                            ${disabledModes.collection ? 'bg-gray-300' : 'bg-[#e07ca4]'}
                            text-white
                            p-1 pl-1.5 xs:h-7 h-8
                            z-40
                            xs:font-stretch-semi-condensed xs:tracking-tight
                            text-sm`}
                        onClick={addToCollection}
                    >
                        {atcMode.icon}
                        <div className="p-0.5 font-semibold uppercase">
                            {atcMode.label}
                        </div>
                    </button>
                    <div className={`collapse-content p-0 min-w-33`}>
                        <div className={`mt-1
                            border-1 border-[#e07ca4] rounded-md
                            bg-overlay
                            text-xs leading-5.5`}>
                            <ul className="menu w-full p-0 m-0" data-collapse-key="atcb">
                                <li onClick={e =>
                                        updateModes(e, Object.assign({}, modes, { collection: 'add' }))}
                                    className="p-1 pl-1.5 cursor-pointer border-b-1 border-[#e07ca433]"
                                >{addToCollectionModeSettings['add'].listText}</li>
                                <li onClick={e =>
                                        updateModes(e, Object.assign({}, modes, { collection: 'trade' }))}
                                    className="p-1 pl-1.5 cursor-pointer border-b-1 border-[#e07ca433]"
                                >{addToCollectionModeSettings['trade'].listText}</li>
                                {statuses?.wishlist && update ? null : <li onClick={e =>
                                            updateModes(e, Object.assign({}, modes, { collection: 'wishlist' }))}
                                        className="p-1 pl-1.5 cursor-pointer border-b-1 border-[#e07ca433]"
                                    >Add to Wishlist</li>}
                                {update && <li onClick={e =>
                                        updateModes(e, Object.assign({}, modes, { collection: 'previous' }))}
                                    className="p-1 pl-1.5 cursor-pointer border-b-1 border-[#e07ca433]"
                                >{addToCollectionModeSettings['previous'].listText}</li>}
                                {update && <li onClick={e =>
                                        updateModes(e, Object.assign({}, modes, { collection: 'clear' }))}
                                    className="p-1 pl-1.5 cursor-pointer border-b-1 border-[#e07ca433]"
                                >{addToCollectionModeSettings['clear'].listText}</li>}
                                <li onClick={e => updateModes(e, Object.assign({}, modes, { collection: 'sell' }))}
                                    className="p-1 pl-1.5 cursor-pointer"
                                >Add to Market</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {ATCForm && <ATCForm formValues={formValues} setFormValues={setFormValues} />}
        </Fragment>
    );

    const addPlayBlock = syncOn && userId && (
        <div key="apb" className="relative shrink-0 xs:w-24 w-26 xs:h-7 h-8">
            <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 xs:w-24 w-26" />
            <button
                className={`collection-button cursor-pointer rounded-full
                    relative
                    flex justify-start items-center                            
                    bg-[#e07ca4] text-white
                    p-1 pl-1.5 xs:h-7 h-8
                    xs:font-stretch-condensed xs:tracking-tight
                    text-sm`}
                onClick={addPlay}
            >
                <FaDice className="w-4 h-4" />
                <div className="p-1 font-semibold uppercase">Log Play</div>
            </button>
        </div>
    );

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
            {ratingFormOpen && <form name="rating-form" className="pt-0.5 pb-2 xs:scale-90 relative xs:left-[-10px]">
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

    const primaries = [
        addToCollectionBlock,
        addPlayBlock,
        addRatingBlock,
    ];

    const primaryActions = syncOn && userId ? <>
        {primaries}
    </> : null

    const secondaryActions = null;

    return { collectionItem, userId, syncOn, primaryActions, secondaryActions, settings };
};

export const useExtensionResponse = () => {
    const dispatch = useDispatch();
    const username = useSelector(state => state.bgg.user?.user);

    const [listening, setListening] = useState<boolean>(false);

    useEffect(() => {
        if (!username || listening) {
            return;
        }
        if (!username) {
            return;
        }
        window.addEventListener('message', event => {
            if (event.origin !== 'https://boardgamegeek.com') {
                return;
            }

            const { data: detail } = event;

            const ce = new CustomEvent('shelfscan-sync', {
                detail,
            });
            document.dispatchEvent(ce);

            const collectionItem = detail.response?.collectionItem ?? detail.response;

            if (!(username &&
                  detail.type.endsWith('response') &&
                    collectionItem?.collid)) {
                return;
            }
            if (detail.type.startsWith('sell')) {
                return;
            }
            const { shouldRemove } = detail.response ?? {};
            dispatch(updateCollectionItems({
                username,
                items: {
                    [collectionItem?.collid]:
                        getCollectionItemFromObject(
                            collectionItem as Record<string, unknown>),
                },
                update: true,
                remove: shouldRemove,
            }));
        });
        setListening(true);
    }, [username, listening, setListening]);
};

export const ExtensionResponse = () => {
    useExtensionResponse();
    return <></>;
};

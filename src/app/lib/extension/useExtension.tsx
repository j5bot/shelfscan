import { getSetting, setSetting } from '@/app/lib/database/database';
import { addPlay } from '@/app/lib/extension/messaging/addPlay';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import {
    Modes,
    ModeSetting,
    ModeSettings,
    ModeSettingFormProps,
    SetFormValues,
} from '@/app/lib/extension/types';
import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useSync } from '@/app/lib/extension/useSync';
import { MakeModeSettings } from '@/app/lib/extension/utils';
import { bggHost } from '@/app/lib/services/bgg/constants';
import { todayString } from '@/app/lib/utils/date';
import { extensionUserMatches } from '@/app/lib/utils/extensionToolAccess';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import {
    getCollectionInfoByObjectId,
} from '@/app/lib/redux/bgg/collection/selectors';
import { BggCollectionItem, BggPlayer } from '@/app/lib/types/bgg';
import {
    CollectionFormState,
    resolveCollectionFormValues,
    statusesToFormValue,
} from '@/app/lib/utils/collectionFormValues';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import { DataForms } from '@/app/ui/extension/DataForms';
import { ModeActionBlock } from '@/app/ui/extension/ModeActionBlock';
import { RatingActionBlock } from '@/app/ui/extension/RatingActionBlock';
import { UpdateInCollectionToggle } from '@/app/ui/extension/UpdateInCollectionToggle';
import React, {
    SyntheticEvent,
    useCallback,
    useEffect,
    useEffectEvent,
    useMemo,
    useState
} from 'react';

export type UseExtension = {
    info?: GameUPCBggInfo & { collectionId?: number };
    version?: GameUPCBggVersion;
    view?: 'version' | 'collection'
};

export type MakeModeBlockParams = {
    modeKey: keyof Modes;
    defaultMode: Modes[keyof Modes];
    addFn: (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => void;
    formKey?: number;
    setFormKey?: (key: number | ((prev: number) => number)) => void;
    formProps?: Partial<ModeSettingFormProps>;
};

// collection item fields an infoLoad reply copies into the info form
const InfoLoadFields = [
    'tradecondition',
    'pricepaid',
    'pp_currency',
    'currvalue',
    'cv_currency',
    'acquisitiondate',
    'acquiredfrom',
    'invdate',
    'invlocation',
];

// wrapper keys for the collection view, in block order
const PrimaryBlockKeys = ['atcb', 'apb', 'arb', 'etb'];

/** The named form's current fields layered over the accumulated form values. */
const readForm = (formName: string, formValues: Record<string, string>) => {
    const form = document.forms.namedItem(formName);
    const formData = form ? new FormData(form) : undefined;
    return {
        formData,
        entries: formData ? Object.assign({}, formValues, Object.fromEntries(formData)) : formValues,
    };
};

/** Briefly pulses the element to confirm an action was sent. */
const pulse = (target: Element | null | undefined) => {
    if (!target) {
        return;
    }
    void (target as HTMLElement).offsetWidth;
    target.classList.add('add-pulse');
    setTimeout(() => target.classList.remove('add-pulse'), 2500);
};

export const useExtension = (params?: UseExtension) => {
    const { info, version, view = 'version' } = params ?? {};
    const { syncOn, userId, currentUsername, extensionUser } = useSync();
    const dispatch = useDispatch();
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const [modes, setModes] = useState<Modes>({ collection: 'add', play: 'quick', tags: 'choose' });
    const [players, setPlayers] = useState<BggPlayer[]>();
    const [updateChoice, setUpdate] = useState<boolean>(true);
    const [formState, setFormState] = useState<CollectionFormState>({ values: {} });
    const [detailedPlayKey, setDetailedPlayKey] = useState<number>(0);

    const { collectionId, collection } =
        useSelector((state) =>
            getCollectionInfoByObjectId([state, info?.id, info?.collectionId]));

    const collectionItem = collection?.items[collectionId];
    // an item that isn't in the collection yet can't be updated
    const update = !!collectionId && updateChoice;
    const isEnabled = syncOn && !!userId && extensionUserMatches(currentUsername, extensionUser);
    const gameName = version?.name ?? info?.name;

    const statuses = collectionItem?.statuses;

    // trade condition and statuses follow the collection item; other fields keep the user's edits
    const currentTradeCondition = collectionItem?.tradeCondition as string | undefined;
    const currentStatuses = statusesToFormValue(collectionItem?.statuses);
    const formValues = useMemo(
        () => resolveCollectionFormValues(formState, {
            tradecondition: currentTradeCondition,
            statuses: currentStatuses,
        }),
        [formState, currentTradeCondition, currentStatuses],
    );
    const setFormValues = useCallback<SetFormValues>(action => {
        const against = { tradecondition: currentTradeCondition, statuses: currentStatuses };
        setFormState(prev => {
            const current = resolveCollectionFormValues(prev, against);
            return {
                values: typeof action === 'function' ? action(current) : action,
                against,
            };
        });
    }, [currentTradeCondition, currentStatuses]);

    const updateModes = async (
        event: SyntheticEvent<HTMLElement> | undefined,
        modes: Modes
    ) => {
        // close mode collapse
        if (event) {
            const collapse = document
                .querySelector(`[data-collapse=${
                    event.currentTarget
                        .parentElement?.getAttribute('data-collapse-key')
                }]`);
            (
                collapse?.querySelector('input[type=checkbox]') as HTMLInputElement | undefined
            )?.click();
        }

        await setSetting('extensionModes', modes);
        setModes(modes);
    };
    const createUpdateModeFn =
        (type: keyof Modes) => (mode: Modes[keyof Modes], setting: ModeSetting) =>
            (e: SyntheticEvent<HTMLElement>) => {
                if (userId && collectionItem && setting.message) {
                    setting.message(userId, dispatchExtensionMessage, collectionItem);
                }
                return updateModes(e, Object.assign({}, modes, { [type]: mode }));
            };


    const addToCollectionFromEvent = async (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        if (!(userId && info?.id)) {
            return;
        }
        const { entries } = readForm(modes.collection, formValues);
        const resultPromise = addToCollection({
            mode: modes.collection,
            modeSetting,
            entries,
            userId,
            name: gameName,
            bggId: info?.id,
            versionId: version?.version_id,
            dispatchExtensionMessage,
        });
        pulse(e.currentTarget.parentElement?.previousElementSibling);
        return await resultPromise;
    };

    const addPlayFromEvent = async (_modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const { entries } = readForm(modes.play, formValues);
        const date = entries.playdate ?? todayString();

        if (!(userId && currentUsername && info?.id)) {
            return;
        }

        const resultPromise = addPlay({
            userId,
            username: currentUsername,
            collectionId,
            name: gameName,
            bggId: info?.id,
            versionId: version?.version_id,
            date,
            entries,
            dispatch,
            dispatchExtensionMessage,
        });

        pulse(e.currentTarget.previousElementSibling);
        return resultPromise;
    };

    const editTags = (_modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const { entries } = readForm('tags', formValues);

        dispatchExtensionMessage({
            userId,
            collectionId,
            type: 'tags',
            formValues: entries,
        });

        pulse(e.currentTarget.previousElementSibling);
    };

    const makeModeBlock = (params: MakeModeBlockParams) => {
        const {
            modeKey,
            defaultMode,
            addFn,
            formKey,
            setFormKey,
            formProps,
        } = params;

        if (!isEnabled) {
            return {};
        }

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
        // only adding a new item can't be 'previous' or 'clear'
        const isDisabled = modeKey === 'collection' && !update && ['previous', 'clear'].includes(currentMode);

        // modes with their own form (e.g. detailed play) open it; others act immediately
        const handleButtonClick = modeSetting.addFn
                                  ? () => setFormKey?.(k => k + 1)
                                  : (e: SyntheticEvent<HTMLButtonElement>) =>
                                      addFn(modeSetting, e);

        return {
            currentMode,
            modeSetting,
            block: modeSetting && (
                <ModeActionBlock
                    key={`${modeKey}-block`}
                    modeKey={modeKey}
                    modeSettings={modeSettings}
                    modeSetting={modeSetting}
                    disabled={isDisabled}
                    statuses={statuses}
                    update={update}
                    onAction={handleButtonClick}
                    onSelectMode={createUpdateModeFn(modeKey)}
                    formProps={{
                        key: formKey,
                        formValues,
                        setFormValues,
                        addFn: modeSetting.addFn,
                        ...formProps,
                    }}
                />
            ),
        };
    };

    const { modeSetting: atcModeSetting, block: addToCollectionBlock } =
        makeModeBlock({
            modeKey: 'collection',
            defaultMode: 'add',
            addFn: addToCollectionFromEvent,
        });

    const { block: addPlayBlock } = makeModeBlock({
        modeKey: 'play',
        defaultMode: 'quick',
        addFn: addPlayFromEvent,
        formKey: detailedPlayKey,
        setFormKey: setDetailedPlayKey,
        formProps: { gameName },
    });

    const { block: editTagsBlock } = makeModeBlock({
        modeKey: 'tags',
        defaultMode: 'choose',
        addFn: editTags,
        formKey: detailedPlayKey,
        setFormKey: setDetailedPlayKey,
        formProps: { gameName },
    });

    // an infoLoad reply fills the info form from the item on BGG, on top of the latest form values
    const applyInfoLoad = useEffectEvent((colItem: BggCollectionItem & { textfield: { privatecomment: { value: string } } }) => {
        setFormValues(prev => {
            const infoFormValues = InfoLoadFields.reduce((acc, field) => Object.assign(acc, {
                [field]: colItem?.[field as keyof BggCollectionItem]?.toString() ?? undefined,
            }), { ...prev });
            infoFormValues.privatecomment = colItem.textfield.privatecomment.value;
            return infoFormValues;
        });
    });

    useEffect(() => {
        (async () => {
            const extensionModes = await getSetting('extensionModes') as Modes ?? modes
            if (!extensionModes.collection) {
                setModes({ collection: 'add', play: 'quick', tags: 'wishlist' });
                return;
            }
            setModes(extensionModes);
        })();

        const messageHandler = (event: MessageEvent) => {
            // players come from the extension's content script on this page,
            // infoLoad responses from the extension's hidden BGG iframe
            if (event.origin !== window.location.origin && event.origin !== bggHost) {
                return;
            }
            if (!players && event.data.players) {
                setPlayers(event.data.players);
            }
            if (event.data?.type === 'infoLoad-response') {
                applyInfoLoad(event.data.response.collectionItem);
            }
        };

        window.addEventListener('message', messageHandler);

        return () => {
            window.removeEventListener('message', messageHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // send once per user/item/mode; the item's own updates (often caused by
    // this message's response) must not re-send it
    const sendATCModeMessage = useEffectEvent(() => {
        if (!(atcModeSetting?.message && userId && collectionItem)) {
            return;
        }
        atcModeSetting.message(userId, dispatchExtensionMessage, collectionItem);
    });
    const hasATCModeMessage = !!atcModeSetting?.message;
    useEffect(() => {
        sendATCModeMessage();
    }, [hasATCModeMessage, userId, collectionId]);


    const addRatingBlock = isEnabled && (
        <RatingActionBlock
            key="arb"
            userId={userId ?? ''}
            collectionId={collectionId}
            gameId={info?.id}
            versionId={version?.version_id}
            name={gameName}
            collectionRating={collectionItem?.rating}
            comment={collectionItem?.comment}
        />
    );

    const settings = isEnabled && <UpdateInCollectionToggle
        collectionId={collectionId}
        update={update}
        onChange={setUpdate}
    />;

    const blocks = [addToCollectionBlock, addPlayBlock, addRatingBlock, editTagsBlock];
    const primaries = view === 'collection'
        ? blocks.map((block, index) => <div key={PrimaryBlockKeys[index]}>{block}</div>)
        : blocks;

    const primaryActions = isEnabled ? <>
        {primaries}
    </> : null;

    const secondaryActions = isEnabled && <DataForms collectionId={collectionId} userId={userId} gameId={info?.id} />;

    return { collectionItem, userId, syncOn, primaryActions, secondaryActions, settings };
};

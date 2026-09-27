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
import { bggHost } from '@/app/lib/services/bgg/constants';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import {
    getCollectionInfoByObjectId,
} from '@/app/lib/redux/bgg/collection/selectors';
import { updateNumPlays } from '@/app/lib/redux/bgg/collection/slice';
import { BggCollectionItem, BggPlayer } from '@/app/lib/types/bgg';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import { DataForms } from '@/app/ui/extension/DataForms';
import { ModeActionBlock } from '@/app/ui/extension/ModeActionBlock';
import { RatingActionBlock } from '@/app/ui/extension/RatingActionBlock';
import { UpdateInCollectionToggle } from '@/app/ui/extension/UpdateInCollectionToggle';
import React, {
    SyntheticEvent,
    useEffect,
    useEffectEvent,
    useState
} from 'react';

type UseExtension = {
    info?: GameUPCBggInfo & { collectionId?: number };
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

// wrapper keys for the collection view, in block order
const PrimaryBlockKeys = ['atcb', 'apb', 'arb', 'etb'];

/** Today as YYYY-MM-DD in local time. */
const todayString = () => {
    const todayDate = new Date();
    return `${
        todayDate.getFullYear()
    }-${
        String(todayDate.getMonth() + 1).padStart(2, '0')
    }-${
        String(todayDate.getDate()).padStart(2, '0')
    }`;
};

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
    const { syncOn, userId, currentUsername } = useSync();
    const dispatch = useDispatch();
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const [modes, setModes] = useState<Modes>({ collection: 'add', play: 'quick', tags: 'choose' });
    const [disabledModes, setDisabledModes] = useState<DisabledModes>({ collection: false, play: false, tags: false });
    const [players, setPlayers] = useState<BggPlayer[]>();
    const [updateChoice, setUpdate] = useState<boolean>(true);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [detailedPlayKey, setDetailedPlayKey] = useState<number>(0);

    const { collectionId, collection } =
        useSelector((state) =>
            getCollectionInfoByObjectId([state, info?.id, info?.collectionId]));

    const collectionItem = collection?.items[collectionId];
    // an item that isn't in the collection yet can't be updated
    const update = !!collectionId && updateChoice;
    const isEnabled = !!(syncOn && userId);
    const gameName = version?.name ?? info?.name;

    const statuses = collectionItem?.statuses;

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

    // a play or tag edit can change the play count; keep the collection in sync
    const syncNumPlays = (detail: DocumentMessageResponseDetail | undefined) => {
        const { numplays } = (detail?.response ?? {}) as { numplays?: number };
        if (numplays != null && collectionId && currentUsername) {
            dispatch(updateNumPlays({
                username: currentUsername,
                collectionId,
                numplays,
            }));
        }
    };

    const addToCollection = (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const { formData, entries } = readForm(modes.collection, formValues);
        if (modeSetting.validator && formData && !modeSetting.validator(formData)) {
            // TODO: handle invalid cases
            return;
        }

        dispatchExtensionMessage({
            userId,
            type: modes.collection,
            collectionId: update ? collectionId : undefined,
            name: gameName,
            gameId: info?.id,
            versionId: version?.version_id,
            formValues: entries,
        });

        pulse(e.currentTarget.parentElement?.previousElementSibling);
    };

    const addPlay = (_modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const { formData, entries } = readForm(modes.play, formValues);
        const dateString = (formData?.get('playdate') as string | undefined) || todayString();

        dispatchExtensionMessage({
            userId,
            collectionId,
            type: 'plays',
            name: gameName,
            gameId: info?.id,
            versionId: version?.version_id,
            date: dateString,
            playdate: dateString,
            formValues: entries,
        })?.then(syncNumPlays);

        pulse(e.currentTarget.previousElementSibling);
    };

    const editTags = (_modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        const { entries } = readForm('tags', formValues);

        dispatchExtensionMessage({
            userId,
            collectionId,
            type: 'tags',
            formValues: entries,
        })?.then(syncNumPlays);

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
                    disabled={disabledModes[modeKey]}
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

    const { currentMode: currentATCMode, modeSetting: atcModeSetting, block: addToCollectionBlock } =
        makeModeBlock({
            modeKey: 'collection',
            defaultMode: 'add',
            addFn: addToCollection,
        });

    const { block: addPlayBlock } = makeModeBlock({
        modeKey: 'play',
        defaultMode: 'quick',
        addFn: addPlay,
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

    const tradeCondition = collectionItem?.tradeCondition;
    useEffect(() => {
        setFormValues(prev => prev['tradecondition'] === tradeCondition ? prev : {
            ...prev,
            tradecondition: tradeCondition as string,
        });
    }, [tradeCondition]);

    const collectionStatuses = collectionItem?.statuses;
    useEffect(() => {
        const statuses = Object.entries(collectionStatuses ?? {}).reduce((acc: string[], [key, value]: [string, boolean]) => {
            if (value) {
                acc.push(key);
            }
            return acc;
        }, []).join(',');
        setFormValues(prev => prev['statuses'] === statuses ? prev : { ...prev, statuses });
    }, [collectionStatuses]);

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
                const colItem = event.data.response.collectionItem;
                const infoFormValues = [
                    'tradecondition',
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
                }, { ...formValues });
                infoFormValues.privatecomment = colItem.textfield.privatecomment.value;
                setFormValues(infoFormValues);
            }
        };

        window.addEventListener('message', messageHandler);

        return () => {
            window.removeEventListener('message', messageHandler);
        };
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

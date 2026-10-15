import { addPlay } from '@/app/lib/extension/messaging/addPlay';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import {
    FormValues,
    Modes,
    ModeSetting,
    ModeSettings,
    ModeSettingFormProps,
} from '@/app/lib/extension/types';
import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useCollectionFormValues } from '@/app/lib/extension/useCollectionFormValues';
import { useExtensionModes } from '@/app/lib/extension/useExtensionModes';
import { useInfoLoadMessages } from '@/app/lib/extension/useInfoLoadMessages';
import { useModeMessage } from '@/app/lib/extension/useModeMessage';
import { useSync } from '@/app/lib/extension/useSync';
import { MakeModeSettings } from '@/app/lib/extension/utils';
import { todayString } from '@/app/lib/utils/date';
import { extensionUserMatches } from '@/app/lib/utils/extensionToolAccess';
import { getExtensionSections, resolveMode } from '@/app/lib/utils/extensionModes';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import {
    getCollectionInfoByObjectId,
} from '@/app/lib/redux/bgg/collection/selectors';
import { INFO_FORM_FIELD_NAMES, readLoadedInfo } from '@/app/lib/utils/collectionInfo';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import { DataForms } from '@/app/ui/extension/DataForms';
import { ModeActionBlock } from '@/app/ui/extension/ModeActionBlock';
import { RatingActionBlock } from '@/app/ui/extension/RatingActionBlock';
import { UpdateInCollectionToggle } from '@/app/ui/extension/UpdateInCollectionToggle';
import React, { SyntheticEvent, useState } from 'react';

export type UseExtension = {
    info?: GameUPCBggInfo & { collectionId?: number };
    version?: GameUPCBggVersion;
    view?: 'version' | 'collection'
    // only the add-to-collection block (a game not in the collection, on a trade page)
    addOnly?: boolean;
};

export type MakeModeBlockParams = {
    modeKey: keyof Modes;
    defaultMode: Modes[keyof Modes];
    addFn: (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => void;
    formKey?: number;
    setFormKey?: (key: number | ((prev: number) => number)) => void;
    formProps?: Partial<ModeSettingFormProps>;
};

// an infoLoad reply replaces these info form fields, clearing any BGG has no value for
const InfoLoadClearedFields = Object.fromEntries(INFO_FORM_FIELD_NAMES
    .filter(field => field !== 'statuses')
    .map(field => [field, undefined]));

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
    const { info, version, view = 'version', addOnly = false } = params ?? {};
    const { syncOn, userId, currentUsername, extensionUser } = useSync();
    const dispatch = useDispatch();
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const { modes, updateModes } = useExtensionModes();

    const [updateChoice, setUpdate] = useState<boolean>(true);
    const [detailedPlayKey, setDetailedPlayKey] = useState<number>(0);

    const { collectionId, collection } =
        useSelector((state) =>
            getCollectionInfoByObjectId([state, info?.id, info?.collectionId]));

    const collectionItem = collection?.items[collectionId];
    // an item that isn't in the collection yet can't be updated
    const update = !!collectionId && updateChoice;
    const isEnabled = syncOn && !!userId && extensionUserMatches(currentUsername, extensionUser);
    const gameName = version?.name ?? info?.name;
    const bggId = info?.id;
    const versionId = version?.version_id;
    const statuses = collectionItem?.statuses;
    const sections = getExtensionSections({ isEnabled, addOnly, view, collectionId });

    const { formValues, setFormValues } = useCollectionFormValues(collectionItem);

    // an infoLoad reply fills the info form from the item on BGG, on top of the latest form values
    useInfoLoadMessages(colItem => {
        setFormValues(prev => ({ ...prev, ...InfoLoadClearedFields, ...readLoadedInfo(colItem) }) as FormValues);
    });

    const createUpdateModeFn =
        (type: keyof Modes) => (mode: Modes[keyof Modes], setting: ModeSetting) =>
            (e: SyntheticEvent<HTMLElement>) => {
                if (userId && collectionItem && setting.message) {
                    setting.message(userId, dispatchExtensionMessage, collectionItem);
                }
                return updateModes(e, { ...modes, [type]: mode });
            };

    const addToCollectionFromEvent = async (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        if (!(userId && bggId)) {
            return;
        }
        const { entries } = readForm(modes.collection, formValues);
        const resultPromise = addToCollection({
            mode: modes.collection,
            modeSetting,
            entries,
            userId,
            name: gameName,
            bggId,
            versionId,
            dispatchExtensionMessage,
        });
        pulse(e.currentTarget.parentElement?.previousElementSibling);
        return await resultPromise;
    };

    const addPlayFromEvent = async (_modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => {
        if (!(userId && currentUsername && bggId)) {
            return;
        }
        const { entries } = readForm(modes.play, formValues);
        const resultPromise = addPlay({
            userId,
            username: currentUsername,
            collectionId,
            name: gameName,
            bggId,
            versionId,
            date: entries.playdate ?? todayString(),
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

    const makeModeBlock = (blockParams: MakeModeBlockParams) => {
        const { modeKey, defaultMode, addFn, formKey, setFormKey, formProps } = blockParams;

        const modeSettings = MakeModeSettings[modeKey]({
            collectionId: collectionItem?.collectionId,
            update,
            statuses,
            addFn,
        }) as ModeSettings;
        const { modeSetting, isDisabled } = resolveMode({
            modeKey,
            modeSettings,
            selectedMode: modes[modeKey],
            defaultMode,
            update,
        });

        // modes with their own form (e.g. detailed play) open it; others act immediately
        const handleButtonClick = modeSetting.addFn
                                  ? () => setFormKey?.(k => k + 1)
                                  : (e: SyntheticEvent<HTMLButtonElement>) => addFn(modeSetting, e);
        const handleSelectMode = createUpdateModeFn(modeKey);
        const blockFormProps = {
            key: formKey,
            formValues,
            setFormValues,
            addFn: modeSetting.addFn,
            ...formProps,
        };

        return {
            modeSetting,
            block: <ModeActionBlock
                key={`${modeKey}-block`}
                modeKey={modeKey}
                modeSettings={modeSettings}
                modeSetting={modeSetting}
                disabled={isDisabled}
                statuses={statuses}
                update={update}
                onAction={handleButtonClick}
                onSelectMode={handleSelectMode}
                formProps={blockFormProps}
            />,
        };
    };

    const addToCollectionMode = makeModeBlock({
        modeKey: 'collection',
        defaultMode: 'add',
        addFn: addToCollectionFromEvent,
    });

    useModeMessage({
        modeSetting: isEnabled ? addToCollectionMode.modeSetting : undefined,
        userId,
        collectionItem,
        dispatchExtensionMessage,
    });

    const addPlayBlock = makeModeBlock({
        modeKey: 'play',
        defaultMode: 'quick',
        addFn: addPlayFromEvent,
        formKey: detailedPlayKey,
        setFormKey: setDetailedPlayKey,
        formProps: { gameName },
    }).block;

    const editTagsBlock = makeModeBlock({
        modeKey: 'tags',
        defaultMode: 'choose',
        addFn: editTags,
        formKey: detailedPlayKey,
        setFormKey: setDetailedPlayKey,
        formProps: { gameName },
    }).block;

    // only rendered when the extension is enabled, which needs a user id
    const actionUserId = userId ?? '';

    const addRatingBlock = <RatingActionBlock
        key="arb"
        userId={actionUserId}
        collectionId={collectionId}
        gameId={bggId}
        versionId={versionId}
        name={gameName}
        collectionRating={collectionItem?.rating}
        comment={collectionItem?.comment}
    />;

    const blocks = sections.addOnly
                   ? [addToCollectionMode.block]
                   : [addToCollectionMode.block, addPlayBlock, addRatingBlock, sections.tags && editTagsBlock];
    const primaries = view === 'collection'
        ? blocks.map((block, index) => <div key={PrimaryBlockKeys[index]}>{block}</div>)
        : blocks;

    const primaryActions = sections.primary ? <>{primaries}</> : null;
    const settings = sections.settings && <UpdateInCollectionToggle
        collectionId={collectionId}
        update={update}
        onChange={setUpdate}
    />;
    const secondaryActions = sections.secondary
                             && <DataForms collectionId={collectionId} userId={actionUserId} gameId={bggId} />;

    return { collectionItem, userId, syncOn, primaryActions, secondaryActions, settings };
};

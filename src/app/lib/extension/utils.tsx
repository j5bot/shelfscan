import { DocumentMessageDetail } from '@/app/lib/extension/messageTypes';
import { CollectionModeSettings, ModeSetting, PlayModeSettings } from '@/app/lib/extension/types';
import { BggCollectionItem, BggCollectionStatuses, BggPlayer } from '@/app/lib/types/bgg';
import { AddInfoForm } from '@/app/ui/extension/AddInfoForm';
import { AddToMarketForm } from '@/app/ui/extension/AddToMarketForm';
import { DetailedPlayForm } from '@/app/ui/extension/DetailedPlayForm';
import { SyntheticEvent } from 'react';
import {
    FaCircleInfo,
    FaClock,
    FaCloudArrowUp,
    FaDice,
    FaHeart,
    FaPlus,
    FaRecycle, FaTag, FaXmark
} from 'react-icons/fa6';
import { GiChessPawn } from 'react-icons/gi';

type MakeModeSettingsParams = {
    collectionId: number | undefined;
    update: boolean;
    statuses?: BggCollectionStatuses;
    addFn?: (modeSetting: ModeSetting, e: SyntheticEvent<HTMLButtonElement>) => void;
};

export const makeNonUserPlayer = (name: string): BggPlayer => ({
    name,
    username: '',
    disambiguator: Math.random(),
    selected: false,
});

export const makeAddPlayModeSettings = ({
    addFn,
}: MakeModeSettingsParams): PlayModeSettings =>
    ({
        quick: {
            label: 'Play',
            listText: 'Quick Log',
            icon: <FaDice className="w-4 h-4 mr-0.5 shrink-0" />,
            width: 'xs:w-20.5 w-22.5',
        },
        detailed: {
            label: 'Detailed',
            listText: 'Detailed Log',
            icon: <GiChessPawn className="w-4.5 h-4.5 mb-1 shrink-0" />,
            width: 'xs:w-27.5 w-29.5',
            form: DetailedPlayForm,
            addFn,
        },
    });

export const makeAddToCollectionModeSettings = ({
    collectionId,
    update,
    statuses,
}: MakeModeSettingsParams): CollectionModeSettings =>
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
                return <form name="trade" className="pb-2 pt-1">
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
            listText: 'Add to Wishlist',
            icon: <FaHeart className="ml-0.5 w-3 h-4 shrink-0" />,
            width: 'xs:w-19.5 w-21.5',
            shouldShow: (statuses, update) => !(statuses?.wishlist || update),
        },
        previous: {
            updateOnly: true,
            label: 'Had It',
            listText: 'Previously Owned',
            icon: <FaClock className="w-3.5 h-3.5 mr-0.5 shrink-0" />,
            width: 'xs:w-22.5 w-24.5',
            shouldShow: (_, update) => update,
        },
        clear: {
            updateOnly: true,
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
            shouldShow: (_, update) => update,
        },
        sell: {
            label: 'Sell',
            listText: 'Add to Market',
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
        info: {
            updateOnly: true,
            label: 'Info',
            listText: 'Private Info',
            icon: <FaCircleInfo className="w-4 h-4 mr-0.5 shrink-0" />,
            width: 'xs:w-23 w-25',
            form: AddInfoForm,
            shouldShow: (_, update) => update,
            message: (
                userId: string,
                dispatchExtensionMessage: (detail: Partial<DocumentMessageDetail>) => void,
                collectionItem: BggCollectionItem,
            ) => {
                dispatchExtensionMessage({
                    userId,
                    type: 'infoLoad',
                    collectionId: collectionItem.collectionId,
                    gameId: collectionItem.objectId,
                    versionId: collectionItem.versionId,
                });
            },
        },
    });

export const MakeModeSettings = {
    collection: makeAddToCollectionModeSettings,
    play: makeAddPlayModeSettings,
} as const;

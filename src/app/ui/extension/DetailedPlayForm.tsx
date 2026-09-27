import { ModeSettingFormProps, ModeSetting } from '@/app/lib/extension/types';
import { makeNonUserPlayer } from '@/app/lib/extension/utils';
import { usePlayData } from '@/app/lib/extension/PlayDataProvider';
import { DurationField } from '@/app/ui/extension/detailed-play/DurationField';
import { LocationCombobox } from '@/app/ui/extension/detailed-play/LocationCombobox';
import { PlayerPicker } from '@/app/ui/extension/detailed-play/PlayerPicker';
import { PlayLoggedConfirmation } from '@/app/ui/extension/detailed-play/PlayLoggedConfirmation';
import { PlayerRow } from '@/app/ui/extension/PlayerRow';
import posthog from 'posthog-js';
import React, { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { GiChessPawn } from 'react-icons/gi';

const todayDate = new Date();
const TODAY = `${
    todayDate.getFullYear()
}-${
    String(todayDate.getMonth() + 1).padStart(2, '0')
}-${
    String(todayDate.getDate()).padStart(2, '0')
}`;

export const DetailedPlayForm = (props: ModeSettingFormProps) => {
    const {
        formValues,
        setFormValues,
        addFn,
        onClose,
        gameName,
    } = props;

    const fieldId = useId();
    const {
        loaded,
        players,
        playData,
        locations,
        getInitialData,
        addLocation,
        addUpdatePlayer,
        addUpdatePlayData,
        clearPlayData,
        searchPlayers,
    } = usePlayData();

    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [confirmed, setConfirmed] = useState<boolean>(false);
    const [playDate, setPlayDate] = useState<string>(TODAY);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [duration, setDuration] = useState<string>(formValues['duration'] ?? '');
    const [customDuration, setCustomDuration] = useState<string>('');

    const setFormValue = (field: string, value: string) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (loaded) {
            return;
        }
        getInitialData(true).then();
    }, [loaded, getInitialData]);

    const handleCancel = () => {
        clearPlayData();
        setIsOpen(false);
        onClose?.();
    };

    // Close modal on Escape
    const onEscape = useEffectEvent(() => handleCancel());
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onEscape();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Clean up auto-close timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const durationMinutes = duration === 'other' ? customDuration : duration;

    const handleSubmit = (e: React.SyntheticEvent<HTMLButtonElement>) => {
        const formPlayers = selectedPlayers.map(pid => {
            const player = players[pid] ?? makeNonUserPlayer(pid);
            return Object.assign({}, player, playData[pid] ?? {});
        });
        // Mutate formValues in place so addFn closure sees the updated players
        setFormValues(Object.assign(formValues, { players: JSON.stringify(formPlayers) }));
        addFn?.({} as ModeSetting, e);
        posthog.capture('detailed_play_logged', {
            player_count: formPlayers.length,
            quantity: Number(formValues['quantity'] ?? 1),
            has_duration: durationMinutes.length > 0,
            is_incomplete: formValues['incomplete'] === '1',
        });
        clearPlayData();
        setConfirmed(true);
        closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            onClose?.();
        }, 2000);
    };

    const togglePlayer = useCallback((id: string) => {
        setSelectedPlayers(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
        );
    }, []);

    const handleDurationChange = (value: string) => {
        setDuration(value);
        if (value !== 'other') {
            setFormValue('duration', value);
        }
    };

    const handleCustomDurationChange = (value: string) => {
        setCustomDuration(value);
        setFormValue('duration', value);
    };

    if (!addFn || !isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={handleCancel}
            aria-modal="true"
            role="dialog"
            aria-label="Log Detailed Play"
        >
            <div
                className={`relative bg-overlay
                    w-full max-w-md
                    rounded-2xl xs:rounded-none
                    p-4 pt-8
                    max-h-dvh overflow-y-auto`}
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                    onClick={handleCancel}
                    aria-label="Close"
                >
                    <FaXmark />
                </button>

                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide">Log Detailed Play</h3>

                {confirmed ? <PlayLoggedConfirmation gameName={gameName} playDate={playDate} /> : <>
                    <form name="detailed" className="flex flex-col gap-1.5 text-xs">
                        {/* Date */}
                        <div className="flex items-center gap-1.5">
                            <label className="w-16 shrink-0" htmlFor={`${fieldId}-date`}>Date</label>
                            <input
                                id={`${fieldId}-date`}
                                type="date"
                                name="playdate"
                                max={TODAY}
                                defaultValue={TODAY}
                                className="input input-xs text-xs flex-1 min-w-0"
                                onChange={e => {
                                    setPlayDate(e.currentTarget.value);
                                    setFormValue('date', e.currentTarget.value);
                                }}
                            />
                        </div>

                        {/* Players multi-select with search */}
                        <div className="flex items-start gap-1.5">
                            <label htmlFor={`${fieldId}-players`} className="w-16 shrink-0 pt-0.5">Players</label>
                            <PlayerPicker
                                id={`${fieldId}-players`}
                                players={players}
                                selectedPlayers={selectedPlayers}
                                togglePlayer={togglePlayer}
                                addUpdatePlayer={addUpdatePlayer}
                                searchPlayers={searchPlayers}
                            />
                        </div>

                        {/* Per-player score / color / win */}
                        {selectedPlayers.length > 0 && (
                            <div className="flex flex-col gap-1 mb-0.5 bg-white border ml-5 pl-1.5 pr-1.5 p-[0.5em] border-gray-200 dark:bg-gray-700 rounded-md">
                                {selectedPlayers.map(id => (
                                    <PlayerRow
                                        key={id}
                                        player={players[id] ?? makeNonUserPlayer(id)}
                                        playData={playData[id] ?? {}}
                                        onUpdate={addUpdatePlayData}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Location combobox */}
                        <div className="flex items-center gap-1.5">
                            <label htmlFor={`${fieldId}-location`} className="w-16 shrink-0">Location</label>
                            <LocationCombobox
                                id={`${fieldId}-location`}
                                initialLocation={formValues['location'] ?? ''}
                                knownLocations={locations}
                                addLocation={addLocation}
                                onChange={location => setFormValue('location', location)}
                            />
                        </div>

                        {/* Comments */}
                        <div className="flex items-start gap-1.5">
                            <label htmlFor={`${fieldId}-comments`} className="w-16 shrink-0 pt-0.5">Comments</label>
                            <textarea
                                id={`${fieldId}-comments`}
                                name="comments"
                                placeholder="Comments"
                                className={`textarea textarea-xs text-xs flex-1 min-w-0 min-h-8 h-8
                                    overflow-hidden overflow-ellipsis
                                    focus:h-16 focus:overflow-auto`}
                                onChange={e => setFormValue('comments', e.currentTarget.value)}
                            />
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-1.5">
                            <label className="w-16 shrink-0" htmlFor={`${fieldId}-quantity`}>Quantity</label>
                            <input
                                id={`${fieldId}-quantity`}
                                type="number"
                                name="quantity"
                                min={1}
                                defaultValue={1}
                                className="input input-xs text-xs w-20"
                                onChange={e => setFormValue('quantity', e.currentTarget.value)}
                            />
                        </div>

                        <DurationField
                            id={`${fieldId}-duration`}
                            duration={duration}
                            customDuration={customDuration}
                            durationMinutes={durationMinutes}
                            onDurationChange={handleDurationChange}
                            onCustomDurationChange={handleCustomDurationChange}
                        />

                        {/* Incomplete */}
                        <div className="flex items-center gap-1.5">
                            <label className="w-16 shrink-0" htmlFor={`${fieldId}-incomplete`}>Incomplete</label>
                            <input
                                id={`${fieldId}-incomplete`}
                                type="checkbox"
                                name="incomplete"
                                className="checkbox checkbox-xs checked:bg-brand-background checked:text-white"
                                onChange={e => setFormValue('incomplete', e.currentTarget.checked ? '1' : '')}
                            />
                        </div>
                    </form>

                    {/* Modal action buttons */}
                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-base-300">
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`collection-button cursor-pointer rounded-full
                                flex items-center gap-1
                                bg-brand-background text-white
                                p-1 pl-2 pr-3
                                text-sm font-semibold uppercase`}
                            onClick={handleSubmit}
                        >
                            <GiChessPawn className="w-4 h-4" />
                            Log Play
                        </button>
                    </div>
                </>}
            </div>
        </div>
    );
};

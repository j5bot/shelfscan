import { FormValues } from '@/app/lib/extension/types';
import { BggPlayerPlay } from '@/app/lib/types/bgg';

/** A logged play, in the shape the add-play tool accepts. */
export type PlayInput = {
    /** YYYY-MM-DD */
    playdate: string;
    location?: string;
    durationMinutes?: number;
    /** How many times the game was played in this session */
    quantity?: number;
    incomplete?: boolean;
    comments?: string;
    players?: BggPlayerPlay[];
};

/**
 * The form values the extension's addPlay reads, matching what the detailed play form sends:
 * `incomplete` is '1' or '', `duration` is minutes, `quantity` is a count, and `players` is a JSON array.
 */
export const makePlayEntries = (play: PlayInput): FormValues => {
    const entries: FormValues = { playdate: play.playdate };
    if (play.location) {
        entries.location = play.location;
    }
    if (play.durationMinutes) {
        entries.duration = String(play.durationMinutes);
    }
    if (play.quantity) {
        entries.quantity = String(play.quantity);
    }
    if (play.incomplete !== undefined) {
        entries.incomplete = play.incomplete ? '1' : '';
    }
    if (play.comments) {
        entries.comments = play.comments;
    }
    if (play.players?.length) {
        entries.players = JSON.stringify(play.players);
    }
    return entries;
};

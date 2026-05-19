import type { BggPlayer, BggPlayerPlay } from '@/app/lib/types/bgg';
import { ColorPicker } from '@/app/ui/extension/ColorPicker';
import { useRef } from 'react';
import { FaTrophy } from 'react-icons/fa6';

type PlayerRowProps = {
    player: BggPlayer;
    playData: Partial<BggPlayerPlay>;
    onUpdate: (play: BggPlayerPlay) => void;
};

export const PlayerRow = ({ player, playData, onUpdate }: PlayerRowProps) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const displayName = player.name || player.username;
    return (
        <div ref={rowRef} className="flex items-center gap-1.5">
            <span
                className="min-w-16 shrink-0 grow truncate text-base-content/70"
                title={displayName}
            >
                {displayName}
            </span>
            <input
                type="text"
                placeholder="Score"
                value={playData.score ?? ''}
                className="input input-xs text-xs pl-1.5 pr-1.5 w-12.5"
                onChange={e => onUpdate(
                    Object.assign({}, player, playData, { score: e.currentTarget.value }) as BggPlayerPlay,
                )}
            />
            <ColorPicker
                value={playData.color ?? ''}
                onChange={color => onUpdate(
                    Object.assign({}, player, playData, { color: color || undefined }) as BggPlayerPlay,
                )}
                rowRef={rowRef}
            />
            <button
                type="button"
                title={playData.win ? 'Winner' : 'Not winner'}
                aria-label={playData.win ? 'Winner' : 'Not winner'}
                aria-pressed={playData.win ?? false}
                className="cursor-pointer transition-colors shrink-0"
                onClick={() => onUpdate(
                    Object.assign({}, player, playData, { win: !playData.win }) as BggPlayerPlay,
                )}
            >
                <FaTrophy className={`w-4 h-4 ${playData.win ? 'text-[#e07ca4]' : 'text-base-content/20 scale-75'}`} />
            </button>
            <input type="hidden" name="win" value={playData.win ? '1' : ''} />
        </div>
    );
};

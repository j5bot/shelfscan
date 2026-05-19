import type { BggPlayer, BggPlayerPlay } from '@/app/lib/types/bgg';
import { ColorPicker } from '@/app/ui/extension/ColorPicker';
import { getBgClassName, getTextClassName, Ratings } from '@/app/ui/extension/RatingForm';
import { CSSProperties, useEffect, useRef, useState } from 'react';
import { FaStar, FaTrophy } from 'react-icons/fa6';

type PlayerRowProps = {
    player: BggPlayer;
    playData: Partial<BggPlayerPlay>;
    onUpdate: (play: BggPlayerPlay) => void;
};

export const PlayerRow = ({ player, playData, onUpdate }: PlayerRowProps) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const starButtonRef = useRef<HTMLButtonElement>(null);
    const ratingContainerRef = useRef<HTMLDivElement>(null);
    const [ratingOpen, setRatingOpen] = useState(false);
    const [ratingStyle, setRatingStyle] = useState<CSSProperties>({});

    const displayName = player.name || player.username;
    const playerRating = parseFloat(playData?.rating ?? '0');
    const bgClassName = getBgClassName(playerRating);
    const ratingClassName = getTextClassName(playerRating);

    useEffect(() => {
        if (!ratingOpen || !starButtonRef.current) {
            return;
        }
        const btnRect = starButtonRef.current.getBoundingClientRect();
        const rowEl = rowRef.current;
        const rowRect = rowEl ? rowEl.getBoundingClientRect() : btnRect;
        setRatingStyle({
            position: 'fixed',
            left: rowRect.left,
            width: rowRect.width,
            bottom: window.innerHeight - btnRect.top + 4,
        });
    }, [ratingOpen]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                ratingContainerRef.current &&
                !ratingContainerRef.current.contains(e.target as Node) &&
                starButtonRef.current &&
                !starButtonRef.current.contains(e.target as Node)
            ) {
                setRatingOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
                className="input input-xs text-xs pl-1.5 pr-1.5 w-14"
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

            <div className="relative">
                <button
                    ref={starButtonRef}
                    type="button"
                    title={playData.rating ? `Rating: ${playData.rating}` : 'No rating'}
                    aria-label={playData.rating ? `Rating: ${playData.rating}` : 'No rating'}
                    className="cursor-pointer transition-colors shrink-0"
                    onClick={() => setRatingOpen(prev => !prev)}
                >
                    <FaStar className={`w-4 h-4 ${playData.rating ? ratingClassName : 'text-base-content/20 scale-75'}`} />
                </button>
                {ratingOpen && (
                    <div
                        ref={ratingContainerRef}
                        className="z-9999 bg-base-100 border border-base-300 rounded-box shadow-lg p-2"
                        style={ratingStyle}
                    >
                        <span className="mr-3">Rating:</span>
                        <div className="rating rating-sm rating-half">
                            {Ratings.map((rating, index) => (
                                <input
                                    key={index}
                                    type="radio"
                                    name={`player-rating-${player.username || player.name}`}
                                    className={`mask mask-star-2 ${index % 2 ? 'mask-half-2' : 'mask-half-1'} ${bgClassName}`}
                                    aria-label={rating.toString()}
                                    value={rating}
                                    defaultChecked={playerRating >= rating && playerRating < (Ratings[index + 1] ?? 11)}
                                    onChange={e => {
                                        onUpdate(
                                            Object.assign({}, player, playData, { rating: e.currentTarget.value }) as BggPlayerPlay,
                                        );
                                        setRatingOpen(false);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

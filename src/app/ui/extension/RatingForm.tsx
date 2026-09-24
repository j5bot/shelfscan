import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { getBgClassName, Ratings } from '@/app/lib/utils/rating';
import { useRating } from '../../lib/extension/useRating';
import posthog from 'posthog-js';
import { memo, useCallback, useState } from 'react';

type RatingFormProps = {
    collectionId?: number;
};

export const RatingForm = memo(({
    collectionId,
}: RatingFormProps) => {
    const item = useSelector((state: RootState) => {
        const username = state.bgg.user.user?.toLowerCase() ?? '';
        return state.bgg.collection.users[username].items[collectionId ?? 0]
    });

    const { createAddRating } = useRating();

    const addRating = createAddRating({
        collectionId: item?.collectionId,
        gameId: item?.objectId,
        versionId: item?.versionId,
        name: item?.name,
    });

    const userRating = item?.rating ?? 0;
    const [newRating, setNewRating] = useState<number>(item?.rating ?? 0);

    const handleNewRating = useCallback((rating: number) => {
        setNewRating(rating);
        addRating?.();
        posthog.capture('game_rating_updated', { rating });
    }, [addRating, setNewRating]);

    if (!item) {
        return null;
    }

    const bgClassName = getBgClassName(newRating);

    return (<form name={`rating-form-${item.collectionId ?? item.objectId ?? 'unknown'}`}
                  className="flex justify-center pt-1.5 xs:scale-90 relative xs:-left-2.5">
        <div className="rating rating-sm rating-half">
            <input type="hidden" className="hidden" name="collectionId" value={item.collectionId} />
            {Ratings.map((rating, index) => (
                <input key={rating} type="radio" name="rating"
                       className={`mask mask-star-2 ${index % 2 ? 'mask-half-2' : 'mask-half-1'} ${bgClassName}`}
                       aria-label={rating.toString()}
                       value={rating}
                       defaultChecked={userRating >= rating && userRating < (Ratings[index + 1] ?? 11)}
                       onChange={() => handleNewRating(rating)}
                />
            ))}
        </div>
    </form>);
});

RatingForm.displayName = 'RatingForm';

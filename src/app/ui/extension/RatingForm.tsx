import { useRating } from '@/app/lib/extension/useRating';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { memo, useCallback, useMemo, useState } from 'react';

type RatingFormProps = {
    collectionId: number;
};

const RATINGS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

const getBgClassName = (newRating: number): string => {
    switch (true) {
        case newRating < 3: return 'bg-red-400';
        case newRating < 4: return 'bg-orange-400';
        case newRating < 5.5: return 'bg-yellow-400';
        case newRating < 7: return 'bg-lime-400';
        default: return 'bg-green-400';
    }
};

export const RatingForm = memo(({
    collectionId,
}: RatingFormProps) => {
    const item = useSelector((state: RootState) => state.bgg.collection.users[state.bgg.user?.user!].items[collectionId]);
    const userRating = item.rating ?? 0;

    const { createAddRating } = useRating();

    const addRating = useCallback(createAddRating({
        collectionId: item.collectionId,
        gameId: item.objectId,
        versionId: item.versionId,
        name: item.name,
    }), [item]);

    const [newRating, setNewRating] = useState<number>(item?.rating ?? 0);

    const handleNewRating = useCallback((rating: number) => {
        setNewRating(rating);
        addRating?.();
    }, [addRating, setNewRating]);

    const bgClassName = getBgClassName(newRating);

    return (<form name={`rating-form-${collectionId ?? item.objectId ?? 'unknown'}`}
                  className="flex justify-center pt-0.5 pb-2 xs:scale-90 relative xs:-left-2.5">
        <div className="rating rating-sm rating-half">
            <input type="hidden" className="hidden" name="collectionId" value={collectionId} />
            {RATINGS.map((rating, index) => (
                <input key={index} type="radio" name="rating"
                       className={`mask mask-star-2 ${index % 2 ? 'mask-half-2' : 'mask-half-1'} ${bgClassName}`}
                       aria-label={rating.toString()}
                       value={rating}
                       defaultChecked={userRating >= rating && userRating < (RATINGS[index + 1] ?? 11)}
                       onChange={() => handleNewRating(rating)}
                />
            ))}
        </div>
    </form>);
});

RatingForm.displayName = 'RatingForm';

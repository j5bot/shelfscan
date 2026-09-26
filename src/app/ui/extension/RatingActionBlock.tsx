import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { getBgClassName, Ratings } from '@/app/lib/utils/rating';
import { SyntheticEvent, useState } from 'react';
import { FaSave } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa6';

type RatingActionBlockProps = {
    userId: string;
    collectionId: number | undefined;
    gameId: number | undefined;
    versionId: number | undefined;
    name: string | undefined;
    collectionRating: number | undefined;
    comment: string | undefined;
};

/** "Rate" button that opens a star rating + comment form and saves it through the extension. */
export const RatingActionBlock = (props: RatingActionBlockProps) => {
    const { userId, collectionId, gameId, versionId, name, collectionRating, comment } = props;
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const [ratingFormOpen, setRatingFormOpen] = useState<boolean>(false);
    const [newRating, setNewRating] = useState<number>(-1);

    const userRating = newRating >= 0 ? newRating : collectionRating ?? -1;
    const formName = `rating-form-${collectionId ?? gameId ?? 'unknown'}`;
    const bgClassName = getBgClassName(newRating);

    const addRating = (e: SyntheticEvent<HTMLButtonElement>) => {
        const form = document.forms.namedItem(formName);
        const formData = form ? new FormData(form) : undefined;

        dispatchExtensionMessage({
            userId,
            type: 'ratings',
            collectionId,
            name,
            gameId,
            versionId,
            formValues: Object.fromEntries(formData ?? []),
        });

        const target = e.currentTarget?.previousElementSibling as HTMLDivElement;
        if (!target || target.tagName.toLowerCase() !== 'button') {
            return;
        }

        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    return <>
        <div className="flex shrink relative items-center gap-1">
            <div className="relative shrink-0 xs:w-17 w-19 xs:h-7 h-8">
                <button
                    className={`collection-button cursor-pointer rounded-full
                        relative
                        flex justify-start items-center
                        bg-brand-background text-white
                        p-1 pl-1.5  xs:h-7 h-8
                        xs:font-stretch-semi-condensed xs:tracking-tight
                        text-sm`}
                    onClick={() => setRatingFormOpen(!ratingFormOpen)}
                >
                    <FaStar className="w-4 h-4" />
                    <div className="p-1 pr-2 font-semibold uppercase">Rate</div>
                </button>
            </div>
            <div className="rounded-full border-0 border-brand-background absolute top-0 right-0 xs:h-7 h-8 w-7"></div>
            {ratingFormOpen && newRating > 0 &&
                <button className={`cursor-pointer relative mr-0.5 xs:h-7 h-8 items-center`}
                        aria-label="Save rating"
                        onClick={addRating}>
                    <FaSave className="w-6 h-6 text-brand-background" />
                </button>}
        </div>
        {ratingFormOpen && <form name={formName}
                                 className="pt-0.5 pb-2 xs:scale-90 relative xs:-left-2.5">
            <div className="rating rating-sm rating-half">
                <input type="hidden" className="hidden" name="collectionId" value={collectionId} />
                {Ratings.map((rating, index) => (
                    <input key={rating} type="radio" name="rating"
                           className={`mask mask-star-2 ${index % 2 ? 'mask-half-2' : 'mask-half-1'}
                           ${bgClassName}`} aria-label={rating.toString()}
                           value={rating}
                           defaultChecked={userRating >= rating && userRating < (Ratings[index + 1] ?? 11)}
                           onClick={() => setNewRating(rating)}
                    />
                ))}
            </div>
            <textarea name="comment"
                      defaultValue={comment}
                      className={`mt-2 textarea textarea-sm w-full min-h-8 h-8 text-xs
                        overflow-hidden
                        overflow-ellipsis
                        pl-1.5 pr-1.5
                        focus:h-16 focus:overflow-auto`}
                      placeholder="Comment/Review" />
        </form>}
    </>;
};

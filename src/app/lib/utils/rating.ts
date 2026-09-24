export const Ratings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

export const getBgClassName = (newRating: number): string => {
    switch (true) {
        case newRating < 3: return 'bg-red-400';
        case newRating < 4: return 'bg-orange-400';
        case newRating < 5.5: return 'bg-yellow-400';
        case newRating < 7: return 'bg-lime-400';
        default: return 'bg-green-400';
    }
};

export const getTextClassName = (newRating: number): string => {
    switch (true) {
        case newRating < 3: return 'text-red-400';
        case newRating < 4: return 'text-orange-400';
        case newRating < 5.5: return 'text-yellow-400';
        case newRating < 7: return 'text-lime-400';
        default: return 'text-green-400';
    }
};

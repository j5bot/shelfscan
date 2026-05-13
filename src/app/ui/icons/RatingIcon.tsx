import { memo } from 'react';

export type RatingIconProps = {
    rating: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    strokeColor?: string;
};

const getRatingColor = (rating: number) => {
    switch (true) {
        case rating < 3:
            return {
                backgroundColor: 'var(--color-red-400)',
                strokeColor: 'var(--color-red-800)',
            };
        case rating < 4:
            return {
                backgroundColor: 'var(--color-orange-400)',
                strokeColor: 'var(--color-orange-800)',
            };
        case rating < 5.5:
            return {
                backgroundColor: 'var(--color-yellow-400)',
                strokeColor: 'var(--color-yellow-800)',
            };
        case rating < 7:
            return {
                backgroundColor: 'var(--color-lime-400)',
                strokeColor: 'var(--color-lime-800)',
            };
        default:
            return {
                backgroundColor: 'var(--color-green-400)',
                strokeColor: 'var(--color-green-800)',
            };
    }
};

export const RatingIcon = memo((props: RatingIconProps) => {
    const { rating, width, height = 48, backgroundColor, strokeColor } = props;

    const colors = getRatingColor(rating);
    const backgroundColorFinal = backgroundColor ?? colors.backgroundColor;
    const strokeColorFinal = strokeColor ?? colors.strokeColor;

    const styles = {
        width: width ?? height * (11.238 / 12.7),
        height,
    };

    return <div className="flex relative justify-center content-center" style={styles}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 11.238 12.7"
            className="absolute top-0 left-0"
            style={styles}
        >
            <path
                d="M10.809 9.43c-.093.157-5.082 2.956-5.263 2.954S.446 9.46.356 9.303C.269 9.145.339 3.425.432 3.269.523 3.113 5.512.313 5.694.316c.18.002 5.1 2.923 5.189 3.08.088.158.018 5.879-.074 6.035"
                paintOrder="markers fill stroke"
                style={{
                    fill: backgroundColorFinal,
                    stroke: strokeColorFinal,
                    strokeWidth: 1,
                }}
            ></path>
        </svg>
        <span className="relative z-5" style={{
            fontSize: `${height * 0.6}px`,
            lineHeight: `${height}px`,
            color: strokeColorFinal,
        }}>{Math.floor(rating)}</span>
    </div>;
});
RatingIcon.displayName = 'RatingIcon';

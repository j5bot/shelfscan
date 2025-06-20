import { ValueOf } from 'next/constants';
import { CSSProperties, SVGAttributes } from 'react';

type ConfidenceProps = SVGAttributes<unknown> & { path: string };

const ConfidenceLevelPaths = {
    FULL: `M97.647 30.707h75.638c4.432 0 8 3.568 8 8v193.52c0 4.432-3.568 8-8 8H97.647c-4.432 0-8-3.568-8-8V38.707c0-4.432 3.568-8 8-8z`,
    HIGH: `M181.286 78.707v153.52c0 4.431-3.568 8-8 8H97.647c-4.432 0-8-3.569-8-8V78.706Z`,
    MEDIUM: `M181.286 128.707v103.52c0 4.431-3.568 8-8 8H97.647c-4.432 0-8-3.569-8-8v-103.52Z`,
    LOW: `M181.286 178.707v53.52c0 4.431-3.568 8-8 8H97.647c-4.432 0-8-3.569-8-8v-53.52Z`,
    POOR: `M181.286 228.707v3.52c0 4.431-3.568 8-8 8H97.647c-4.432 0-8-3.569-8-8v-3.52Z`,
} as const;
type ConfidenceLevelPath = ValueOf<typeof ConfidenceLevelPaths>;

const getConfidenceLevelPath = (confidence: number): ConfidenceLevelPath => {
    switch (true) {
        case confidence >= 90:
            return ConfidenceLevelPaths.FULL;
        case confidence >= 70:
            return ConfidenceLevelPaths.HIGH;
        case confidence >= 50:
            return ConfidenceLevelPaths.MEDIUM;
        case confidence >= 30:
            return ConfidenceLevelPaths.LOW
        default:
            return ConfidenceLevelPaths.POOR;
    }
};

export type ConfidenceLevelIconProps = {
    confidence: number;
    barColor?: string;
    frameBackgroundColor?: string;
    frameColor?: string;
};

const ConfidenceSVG = (props: ConfidenceProps)=> {
    const { path, ...svgProps } = props;
    const pathProps = {
        d: path,
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 270.933 270.933"
            {...svgProps}
        >
            <rect
                width={117.89}
                height={242}
                x={76.522}
                y={14.467}
                style={{
                    stroke: 'var(--frame-color)',
                    fill: 'var(--frame-fill)',
                }}
                strokeDashoffset={5.28}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={12}
                rx={16}
                ry={16}
            />
            <path
                style={{
                    fill: 'var(--bar-fill)',
                }}
                {...pathProps}
            />
        </svg>
    );
};

export const ConfidenceLevelIcon = (props: ConfidenceLevelIconProps) => {
    const {
        confidence,
        barColor = 'currentColor',
        frameBackgroundColor = 'transparent',
        frameColor = 'currentColor',
    } = props;
    const confidenceLevelPath = getConfidenceLevelPath(confidence);
    const style = {
        '--bar-fill': barColor,
        '--frame-fill': frameBackgroundColor,
        '--frame-color': frameColor
    } as CSSProperties;

    return <ConfidenceSVG width={24} height={24} path={confidenceLevelPath} style={style} />;
};

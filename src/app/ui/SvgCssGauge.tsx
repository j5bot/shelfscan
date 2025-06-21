import './SvgCssGauge.css';
import { CSSProperties } from 'react';

export type SvgCssGaugeProps = {
    color?: string;
    fill?: string;
    width?: string;
    value: number;
    gap?: string;
    duration?: number;
    className?: string;
};

export const SvgCssGauge = (props: SvgCssGaugeProps) => {
    const {
        color = 'currentColor',
        fill = 'currentColor',
        width = '20%',
        value,
        gap = '10%',
        duration = 0.5,
        className = '',
    } = props;

    const style = {
        '--svg-css-gauge-color': color,
        '--svg-css-gauge-fill': fill,
        '--svg-css-gauge-width': width,
        '--svg-css-gauge-value': value,
        '--svg-css-gauge-gap': gap,
        '--svg-css-gauge-animate-duration': `${duration}s`,
    } as CSSProperties;

    return <div
        className={`svg-css-gauge w-4 h-4 ${className}`}
        style={style}
    >
        <svg fill="none" viewBox="0 0 256 256">
            <circle cx="128" r="1" cy="128" pathLength="100" />
            <circle cx="128" r="0" cy="128" pathLength="100" />
        </svg>
    </div>;
};

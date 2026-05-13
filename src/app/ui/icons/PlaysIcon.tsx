import { memo, SVGProps } from 'react';

export type PlaysIconProps = SVGProps<any> & {
    plays: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    strokeColor?: string;
};

export const PlaysIcon = memo((props: PlaysIconProps) => {
    const { plays, width, height = 48, backgroundColor, strokeColor } = props;

    const styles = {
        width: width ?? height,
        height,
    };

    return <div className="flex relative justify-center content-center" style={styles}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            style={styles}
            className="absolute top-0 left-0"
        >
            <path
                style={{
                    fill: backgroundColor,
                    stroke: strokeColor,
                    strokeWidth: 34,
                }}
                d="M428.83 428.831C424.861 432.8 261.612 500.42 256 500.42S87.139 432.8 83.17 428.83s-71.589-167.218-71.589-172.83S79.201 87.14 83.17 83.171 250.388 11.582 256 11.582s168.861 67.62 172.83 71.589 71.589 167.218 71.589 172.83-67.62 168.861-71.589 172.83"
                paintOrder="markers fill stroke"
            ></path>
        </svg>
        <span className="relative z-5" style={{
            fontSize: `${height * 0.6}px`,
            lineHeight: `${height}px`,
            color: strokeColor,
        }}>{plays}</span>
    </div>;
});
PlaysIcon.displayName = 'PlaysIcon';

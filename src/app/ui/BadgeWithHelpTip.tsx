import React, { ReactNode } from 'react';

export type BadgeWithHelpTipProps = {
    children: ReactNode;
    tooltipContent: ReactNode;
    className?: string;
    locationClassName?: string;
};

export const BadgeWithHelpTip = (props: BadgeWithHelpTipProps) => {
    const {
        children,
        tooltipContent,
        className,
        locationClassName,
    } = props;

    return (
        <div className={`tooltip cursor-pointer ${locationClassName}`}>
            <div className="tooltip-content">
                {tooltipContent}
            </div>
            <span className={`badge ${className}`}>
                {children}
            </span>
        </div>
    );
};

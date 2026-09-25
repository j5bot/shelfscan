import { ReactNode } from 'react';

const AlertKinds = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
} as const;

type DismissibleToastProps = {
    id?: string;
    kind: keyof typeof AlertKinds;
    role?: 'alert' | 'status';
    onDismiss: () => void;
    children: ReactNode;
};

/** A toast whose whole body is a dismiss button, so it can be dismissed by keyboard as well as by click. */
export const DismissibleToast = ({ id, kind, role = 'alert', onDismiss, children }: DismissibleToastProps) =>
    <div id={id} className="toast toast-top toast-center z-50">
        <div role={role}>
            <button
                type="button"
                className={`alert ${AlertKinds[kind]} shadow-lg cursor-pointer text-left`}
                onClick={onDismiss}
            >
                {children}
                <span className="sr-only">Dismiss</span>
            </button>
        </div>
    </div>;

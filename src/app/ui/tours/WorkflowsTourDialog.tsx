import { testUPC } from '@/app/ui/tours/consts';
import Image from 'next/image';
import Link from 'next/link';
import { useNextStep } from 'nextstepjs';
import React, { MouseEvent, Ref } from 'react';

type WorkflowLink = {
    name: string;
    href: string;
    tour: string;
    label: string;
};

const workflowLinks: WorkflowLink[] = [
    {
        name: 'scanner',
        href: '/',
        tour: 'scanner',
        label: 'Scan Games',
    },
    {
        name: 'gameDetails',
        href: `/upc/${testUPC}`,
        tour: 'gamePage',
        label: 'Game Details',
    },
];

type WorkflowsTourDialogProps = {
    ref?: Ref<HTMLDialogElement>;
};

export const WorkflowsTourDialog = ({ ref }: WorkflowsTourDialogProps) => {
    const { startNextStep, closeNextStep } = useNextStep();

    const switchTour = (
        event: MouseEvent<HTMLAnchorElement>,
        newTour: string,
    ) => {
        event.currentTarget.closest('dialog')?.close();
        closeNextStep();
        setTimeout(() => startNextStep(newTour), 300);
    };

    return <dialog ref={ref} className="modal">
        <div className="modal-box min-w-86 max-w-1/2">
            <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-4">✕</button>
            </form>
            <div className="flex flex-col gap-2">
                <Image
                    priority={true}
                    src={'/wordmark.svg'}
                    alt="ShelfScan"
                    width={200} height={64}
                />
                <div>
                    ShelfScan supports many workflows.  Select one below to begin exploring.
                </div>
                {workflowLinks.map(workflowLink => (
                    <Link
                        key={workflowLink.name}
                        href={workflowLink.href}
                        className="text-xl font-sharetech btn bg-brand-background text-white rounded-lg"
                        onClick={event => switchTour(event, workflowLink.tour)}
                    >{workflowLink.label}</Link>
                ))}
            </div>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>;
};

import { useSync } from '@/app/lib/extension/useSync';
import { useSettings } from '@/app/lib/SettingsProvider';
import { testUPCs } from '@/app/ui/tours/consts';
import { useCollectionSelectors } from '@/app/ui/tours/hooks';
import Image from 'next/image';
import Link from 'next/link';
import { useNextStep } from 'nextstepjs';
import React, { MouseEvent, ReactNode, Ref } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { FaBarcode, FaFilter, FaLayerGroup } from 'react-icons/fa6';

type WorkflowLink = {
    name: string;
    icon: ReactNode;
    href: string;
    tour: string;
    label: string;
    extensionRequired?: boolean;
    collectionRequired?: boolean;
};

const workflowLinks: WorkflowLink[] = [
    {
        name: 'batchscan',
        icon: <FaLayerGroup className="w-5 h-5" />,
        href: '/batch',
        tour: 'batchscan',
        label: 'Batch Scanning',
    },
    {
        name: 'scanner',
        icon: <FaBarcode className="w-5 h-5" />,
        href: '/',
        tour: 'scanner',
        label: 'Scanning Games',
    },
    {
        name: 'gameDetails',
        icon: <FaInfoCircle className="w-5 h-5" />,
        href: `/upc/${testUPCs[0]}`,
        tour: 'gamePage',
        label: 'Game Details',
    },
    {
        name: 'collectionFiltering',
        icon: <FaFilter className="w-5 h-5" />,
        href: '/collection',
        tour: 'collectionFiltering',
        label: 'Collection Filtering',
        extensionRequired: true,
        collectionRequired: true,
    },
];

type WorkflowsTourDialogProps = {
    ref?: Ref<HTMLDialogElement>;
};

export const WorkflowsTourDialog = ({ ref }: WorkflowsTourDialogProps) => {
    const { syncOn } = useSync();
    const { currentUsername, collection } = useCollectionSelectors();
    const { startNextStep, closeNextStep } = useNextStep();
    const { settings: { dismissedTours }, setSetting } = useSettings();

    const hasCollection = currentUsername !== undefined && Object.keys(collection?.items).length > 0;

    const switchTour = (
        event: MouseEvent<HTMLAnchorElement>,
        newTour: string,
    ) => {
        event.currentTarget.closest('dialog')?.close();
        closeNextStep();
        setTimeout(() => startNextStep(newTour), 300);
    };

    return <dialog ref={ref} className="modal tours">
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
                    ShelfScan supports many <Link href="/workflows"
                                                  className="underline"
                                                  target="_blank"
                >workflows</Link>.  Select one below to begin exploring.
                </div>
                {workflowLinks.map(workflowLink => {
                    const disabled =
                        (workflowLink.extensionRequired && !syncOn)
                        || (workflowLink.collectionRequired && !hasCollection);

                    return (
                        <Link
                            key={workflowLink.name}
                            href={workflowLink.href}
                            className={`flex items-center gap-2 text-xl font-sharetech
                                btn bg-brand-background text-white rounded-lg
                                ${disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : ''}`}
                            onClick={event => {
                                if (disabled) {
                                    event.preventDefault();
                                    return;
                                }
                                switchTour(event, workflowLink.tour);
                            }}
                            aria-disabled={disabled}
                        >{workflowLink.icon} {workflowLink.label}</Link>
                    );
                })}
                <button className="btn bg-gray-300 rounded-lg"
                    onClick={event => {
                        event.currentTarget.closest('dialog')?.close();
                        setSetting('dismissedTours', Object.assign(
                            dismissedTours as Record<string, boolean> ?? {}, {
                                main: true,
                            }
                        )).then();
                    }}
                >
                    Hide Tours
                </button>
            </div>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>;
};

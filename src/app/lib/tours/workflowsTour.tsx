import { testUPC } from '@/app/lib/tours/index';
import { TourCardProps } from '@/app/ui/tour/TourCard';
import Link from 'next/link';
import { useNextStep } from 'nextstepjs';

const workflowLinks = [
    {
        name: 'scanner',
        href: '/',
        tour: 'scanner',
        label: 'Scan Games'
    },
    {
        name: 'gameDetails',
        href: `/upc/${testUPC}`,
        tour: 'gamePage',
        label: 'Game Details'
    }
];

export const WorkflowsStartStep = (props: TourCardProps) => {
    const { skipTour } = props;

    const { startNextStep, closeNextStep } = useNextStep();

    return <div className="flex flex-col gap-2">
        <div>
            ShelfScan supports many workflows.  Select one below to begin exploring workflows and features.
        </div>
        {workflowLinks.map(workflowLink => (
            <Link
                href={workflowLink.href}
                className="btn"
                onClick={() => {
                    skipTour?.();
                    closeNextStep();
                    setTimeout(() => {
                        startNextStep(workflowLink.tour);
                    }, 1000);
                }}
            >{workflowLink.label}</Link>
        ))}
    </div>;
};
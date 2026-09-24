import { NextStepFn, useCollection, useUsername } from '@/app/ui/tours/hooks';

type StepContentProps = {
    nextStep: NextStepFn;
};

export const UsernameStepContent = ({ nextStep }: StepContentProps) => {
    useUsername(nextStep);

    return <>{`Enter your BGG username to integrate your collection info with ShelfScan.  If you
            don't have a BGG account, just enter 'ShelfScan'`}</>;
};

export const CollectionStepContent = ({ nextStep }: StepContentProps) => {
    useCollection(nextStep);

    return <>{`Click 'Get Collection' to get BGG collection info`}</>;
};

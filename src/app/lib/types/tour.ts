import { CardComponentProps, Step, Tour as NextStepTour } from 'nextstepjs';

export type TourStep = (Step | ((params: CardComponentProps) => Step));
export type Tour = NextStepTour | {
    steps: TourStep[];
};

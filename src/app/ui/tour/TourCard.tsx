// copy of NextStep DefaultCard
import { TourStep } from '@/app/lib/types/tour';
import React from 'react';
import { CardComponentProps } from 'nextstepjs';

import './TourCard.css';

export type TourCardProps = CardComponentProps & {
    step: TourStep;
}

export const TourCard = (props: TourCardProps) => {
    const {
        step: baseStep,
        currentStep,
        totalSteps,
        nextStep,
        prevStep,
        skipTour,
        arrow,
    } = props;
    const step = typeof baseStep === 'function' ? baseStep(props) : baseStep;

    return (
        <div className="tour-card">
            <div className="tour-card-heading">
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{step.title}</h2>
                {step.icon && <span style={{ fontSize: '1.5rem' }}>{step.icon}</span>}
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>{step.content}</div>

            <div
                style={{
                    marginBottom: '1rem',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '9999px',
                    height: '0.625rem',
                }}
            >
                <div
                    style={{
                        backgroundColor: '#2563EB',
                        height: '0.625rem',
                        borderRadius: '9999px',
                        width: `${((currentStep + 1) / totalSteps) * 100}%`,
                    }}
                ></div>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.75rem',
                }}
            >
                <button
                    onClick={prevStep}
                    style={{
                        padding: '0.5rem 1rem',
                        fontWeight: '500',
                        color: '#4B5563',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: step.showControls ? 'block' : 'none',
                    }}
                    disabled={currentStep === 0}
                >
                    Previous
                </button>
                <span style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
          {currentStep + 1} of {totalSteps}
        </span>
                {currentStep === totalSteps - 1 ? (
                    <button
                        onClick={skipTour}
                        style={{
                            padding: '0.5rem 1rem',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#10B981',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: step.showControls ? 'block' : 'none',
                        }}
                    >
                        Finish
                    </button>
                ) : (
                     <button
                         onClick={nextStep}
                         style={{
                             padding: '0.5rem 1rem',
                             fontWeight: '500',
                             color: 'white',
                             backgroundColor: '#2563EB',
                             borderRadius: '0.375rem',
                             cursor: 'pointer',
                             display: step.showControls ? 'block' : 'none',
                         }}
                     >
                         Next
                     </button>
                 )}
            </div>

            {arrow}

            {skipTour && currentStep < totalSteps - 1 && (
                <button
                    onClick={skipTour}
                    style={{
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontWeight: '500',
                        color: '#4B5563',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: step.showSkip ? 'block' : 'none',
                    }}
                >
                    Skip Tour
                </button>
            )}
        </div>
    );
};
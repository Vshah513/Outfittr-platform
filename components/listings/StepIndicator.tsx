import React from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile: Simple progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-[0.1em] font-medium text-vintage-muted">
            Step {currentStep} of {steps.length}
          </p>
          <p className="text-xs text-vintage-secondary">
            {Math.round((currentStep / steps.length) * 100)}% complete
          </p>
        </div>
        <div className="h-1 bg-vintage-stone rounded-full overflow-hidden">
          <div 
            className="h-full bg-vintage-primary transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-vintage-primary">
          {steps[currentStep - 1]?.title}
        </p>
      </div>

      {/* Desktop: Full stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-4 flex-1">
                {/* Step Circle */}
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  font-medium text-sm transition-all duration-300
                  ${isCompleted 
                    ? 'bg-vintage-primary text-white' 
                    : isActive 
                      ? 'bg-vintage-primary text-white ring-4 ring-vintage-stone' 
                      : 'bg-vintage-stone text-vintage-muted'
                  }
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <p className={`
                    text-xs uppercase tracking-[0.1em] font-medium
                    ${isActive || isCompleted ? 'text-vintage-primary' : 'text-vintage-secondary'}
                  `}>
                    Step {step.number}
                  </p>
                  <p className={`
                    text-sm font-medium transition-colors
                    ${isActive ? 'text-vintage-primary' : 'text-vintage-muted'}
                  `}>
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`
                  h-0.5 w-full max-w-[80px] mx-4 transition-colors duration-500
                  ${isCompleted ? 'bg-vintage-primary' : 'bg-vintage-stone'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}


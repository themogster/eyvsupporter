import { Step } from '@/hooks/use-image-processor';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: Step;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = ['upload', 'preview', 'download'] as const;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
      <div className="flex justify-center space-x-2">
        {steps.map((step, index) => {
          const isActive = currentStep === step;
          const isCompleted = steps.indexOf(currentStep) > index;
          
          return (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-colors ${
                isCompleted
                  ? 'bg-green-500'
                  : isActive
                  ? 'bg-deep-purple'
                  : 'bg-gray-300'
              }`}
            >
              {isCompleted && (
                <Check className="w-2 h-2 text-white m-0.5" strokeWidth={3} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Step } from '@/hooks/use-image-processor';
import { Check, Heart } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: Step;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = ['upload', 'preview', 'download', 'thankyou'] as const;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 max-w-md mx-auto">
      <div className="flex justify-center space-x-2">
        {steps.map((step, index) => {
          const isActive = currentStep === step;
          const isCompleted = steps.indexOf(currentStep) > index;
          const isThankYouStage = step === 'thankyou';
          const isThankYouCompleted = currentStep === 'thankyou' && isActive;
          
          return (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-colors ${
                isThankYouCompleted
                  ? 'bg-red-500'
                  : isCompleted
                  ? 'bg-green-500'
                  : isActive
                  ? 'bg-deep-purple'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              {isThankYouCompleted ? (
                <Heart className="w-2 h-2 text-white m-0.5 fill-current" strokeWidth={0} />
              ) : isCompleted ? (
                <Check className="w-2 h-2 text-white m-0.5" strokeWidth={3} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

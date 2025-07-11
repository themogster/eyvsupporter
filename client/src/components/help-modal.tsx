import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Import the walkthrough screenshots
import step1Image from "@assets/Screenshot 2025-07-11 130854_1752236038790.png";
import step2Image from "@assets/Screenshot 2025-07-11 130916_1752236043268.png";
import step3Image from "@assets/Screenshot 2025-07-11 130942_1752236047002.png";
import step4Image from "@assets/Screenshot 2025-07-11 130959_1752236050824.png";
import step5Image from "@assets/Screenshot 2025-07-11 131032_1752236055228.png";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalkthroughStep {
  id: number;
  title: string;
  description: string;
  image: string;
  tips: string[];
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 1,
    title: "Upload Your Photo",
    description: "Start by uploading a photo from your device. The app accepts JPG, PNG, and WEBP files up to 10MB in size.",
    image: step1Image,
    tips: [
      "Choose a high-quality photo for best results",
      "Make sure your face is clearly visible",
      "Square photos work best for profile pictures"
    ]
  },
  {
    id: 2,
    title: "Preview & Basic Editing",
    description: "Your photo is automatically optimized for Facebook (180x180px) with EYV branding. You can drag to reposition and use pinch or scroll to zoom.",
    image: step2Image,
    tips: [
      "Drag the image to center your face in the circle",
      "Use the zoom slider to get the perfect fit",
      "The purple border adds EYV branding automatically"
    ]
  },
  {
    id: 3,
    title: "Customize Your Message",
    description: "Add a curved text message and choose your preferred text color and position to show your support for Early Years Voice.",
    image: step3Image,
    tips: [
      "Select from pre-written messages or choose 'No text'",
      "Pick a text color that stands out against your photo",
      "Adjust text position using the slider (0° = right, 90° = top, etc.)"
    ]
  },
  {
    id: 4,
    title: "Download Your Profile Picture",
    description: "Your EYV-branded profile picture is ready! Download it to save to your device.",
    image: step4Image,
    tips: [
      "The image is perfectly sized for Facebook profile pictures",
      "EYV logo is automatically included in the corner",
      "Click 'Create Another' to make more profile pictures"
    ]
  },
  {
    id: 5,
    title: "Thank You & Support EYV",
    description: "Thank you for supporting Early Years Voice! Consider visiting their donation page to make a contribution.",
    image: step5Image,
    tips: [
      "Your support helps EYV continue their important work",
      "Share your new profile picture on social media",
      "Encourage friends to create their own EYV profile pictures"
    ]
  }
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = walkthroughSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            How to Use EYV Profile Creator
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step indicators */}
          <div className="flex justify-center space-x-2">
            {walkthroughSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-purple-600'
                    : index < currentStep
                    ? 'bg-purple-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Current step content */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="text-sm">
              Step {currentStepData.id} of {walkthroughSteps.length}
            </Badge>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {currentStepData.title}
            </h3>

            {/* Screenshot */}
            <div className="relative mx-auto">
              <img
                src={currentStepData.image}
                alt={`Step ${currentStepData.id}: ${currentStepData.title}`}
                className="w-full max-w-xs mx-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
              />
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Tips */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-left">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 text-sm">
                💡 Helpful Tips:
              </h4>
              <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentStep + 1} / {walkthroughSteps.length}
            </span>

            {currentStep < walkthroughSteps.length - 1 ? (
              <Button
                size="sm"
                onClick={nextStep}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700"
              >
                Got it!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// Remove UserCircle import as we're using the logo image
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { UploadSection } from '@/components/upload-section';
import { PreviewSection } from '@/components/preview-section';
import { DownloadSection } from '@/components/download-section';
import { ThankYouSection } from '@/components/thankyou-section';
import { ProgressIndicator } from '@/components/progress-indicator';
import { useImageProcessor } from '@/hooks/use-image-processor';
import { Button } from '@/components/ui/button';
import { HelpModal } from '@/components/help-modal';

import { SettingsDropdown } from '@/components/settings-dropdown';

export default function Home() {
  console.log('Home component rendering');
  
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  const {
    currentStep,
    processedImage,
    isProcessing,
    transform,
    curvedText,
    textColor,
    textPosition,
    shareUrl,
    processImage,
    proceedToDownload,
    proceedToThankYou,
    downloadProcessedImage,
    shareImage,
    updateTransform,
    setCurvedTextOption,
    setTextColorOption,
    setTextPositionOption,
    startOver
  } = useImageProcessor();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black lg:bg-gray-100 lg:dark:bg-black">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen shadow-lg lg:shadow-xl">
      {/* Header */}
      <div className="bg-deep-purple text-white">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="EYV Logo" 
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  console.log('Header logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('Header logo loaded successfully')}
              />
              <h1 className="text-2xl font-bold">Early Years Voice Supporter</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-white [&>*]:text-white [&>*]:hover:bg-purple-600">
                <SettingsDropdown />
              </div>
            </div>
          </div>
          <p className="text-purple-100 text-sm">Create the perfect Facebook profile picture to support Early Years Voice!</p>
        </div>
        

      </div>
      {/* Main Content */}
      <div className="p-6 space-y-6 pb-20 bg-white dark:bg-gray-900">
        {currentStep === 'upload' && (
          <UploadSection
            onImageSelect={processImage}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'preview' && (
          <PreviewSection
            processedImage={processedImage}
            transform={transform}
            curvedText={curvedText}
            textColor={textColor}
            textPosition={textPosition}
            onTransformChange={updateTransform}
            onCurvedTextChange={setCurvedTextOption}
            onTextColorChange={setTextColorOption}
            onTextPositionChange={setTextPositionOption}
            onProceedToDownload={proceedToDownload}
            onStartOver={startOver}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'download' && (
          <DownloadSection
            processedImage={processedImage}
            shareUrl={shareUrl}
            onDownload={downloadProcessedImage}
            onShare={shareImage}
            onStartOver={startOver}
            onProceedToThankYou={proceedToThankYou}
          />
        )}

        {currentStep === 'thankyou' && (
          <ThankYouSection
            onStartOver={startOver}
          />
        )}

        {/* Help Button */}
        <div className="flex justify-center pt-8">
          <Button
            variant="outline"
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20"
          >
            <HelpCircle className="h-4 w-4" />
            How to Use
          </Button>
        </div>
      </div>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} />
      
      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
      </div>
    </div>
  );
}

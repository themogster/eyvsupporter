// Remove UserCircle import as we're using the logo image
import { useState } from 'react';
import { UploadSection } from '@/components/upload-section';
import { PreviewSection } from '@/components/preview-section';
import { DownloadSection } from '@/components/download-section';
import { ThankYouSection } from '@/components/thankyou-section';
import { ProgressIndicator } from '@/components/progress-indicator';
import { useImageProcessor } from '@/hooks/use-image-processor';

import { SettingsDropdown } from '@/components/settings-dropdown';

export default function Home() {
  console.log('Home component rendering');
  
  const {
    currentStep,
    processedImage,
    isProcessing,
    transform,
    curvedText,
    textColor,
    textPosition,
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
      </div>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} />
      </div>
    </div>
  );
}

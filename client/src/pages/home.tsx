// Remove UserCircle import as we're using the logo image
import { UploadSection } from '@/components/upload-section';
import { PreviewSection } from '@/components/preview-section';
import { DownloadSection } from '@/components/download-section';
import { ProgressIndicator } from '@/components/progress-indicator';
import { useImageProcessor } from '@/hooks/use-image-processor';

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
    downloadProcessedImage,
    shareImage,
    updateTransform,
    setCurvedTextOption,
    setTextColorOption,
    setTextPositionOption,
    startOver
  } = useImageProcessor();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {/* Header */}
      <div className="bg-deep-purple text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Early Years Voice Supporter</h1>
          <img 
            src="/logo.png" 
            alt="EYV Logo" 
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              console.log('Header logo failed to load');
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log('Header logo loaded successfully')}
          />
        </div>
        <p className="text-purple-100 text-sm">Create the perfect Facebook profile picture to support Early Years Voice!</p>
      </div>
      {/* Main Content */}
      <div className="p-6 space-y-6 pb-20">
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
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'download' && (
          <DownloadSection
            processedImage={processedImage}
            onDownload={downloadProcessedImage}
            onShare={shareImage}
            onStartOver={startOver}
          />
        )}
      </div>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} />
    </div>
  );
}

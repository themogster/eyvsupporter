import { UserCircle } from 'lucide-react';
import { UploadSection } from '@/components/upload-section';
import { PreviewSection } from '@/components/preview-section';
import { DownloadSection } from '@/components/download-section';
import { ProgressIndicator } from '@/components/progress-indicator';
import { useImageProcessor } from '@/hooks/use-image-processor';

export default function Home() {
  const {
    currentStep,
    processedImage,
    isProcessing,
    transform,
    logoFile,
    processImage,
    setLogo,
    proceedToDownload,
    downloadProcessedImage,
    shareImage,
    updateTransform,
    startOver
  } = useImageProcessor();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {/* Header */}
      <div className="bg-deep-purple text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">EYV Support</h1>
          <img src="/eyv-logo.png" alt="EYV Logo" className="w-8 h-8 rounded-full" />
        </div>
        <p className="text-purple-100 text-sm">Create the perfect Facebook profile picture with EYV branding</p>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6 pb-20">
        {currentStep === 'upload' && (
          <UploadSection
            onImageSelect={processImage}
            onLogoSelect={setLogo}
            logoFile={logoFile}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'preview' && (
          <PreviewSection
            processedImage={processedImage}
            transform={transform}
            onTransformChange={updateTransform}
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

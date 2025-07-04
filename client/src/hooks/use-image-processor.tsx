import { useState, useCallback } from 'react';
import { ImageProcessor, ProcessedImage, validateImageFile, downloadImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

export type Step = 'upload' | 'preview' | 'download';

export function useImageProcessor() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processor = new ImageProcessor();

  const processImage = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processor.processImage(file);
      setOriginalImage(file);
      setProcessedImage(result);
      setCurrentStep('preview');
      
      toast({
        title: "Image Processed",
        description: "Your profile picture has been created successfully!",
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const proceedToDownload = useCallback(() => {
    setCurrentStep('download');
  }, []);

  const downloadProcessedImage = useCallback(() => {
    if (processedImage) {
      downloadImage(processedImage.blob, 'eyv-profile-picture.png');
      toast({
        title: "Download Started",
        description: "Your EYV profile picture is being downloaded!",
      });
    }
  }, [processedImage, toast]);

  const shareImage = useCallback(async () => {
    if (!processedImage) return;

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([processedImage.blob], 'eyv-profile-picture.png', { type: 'image/png' });
        await navigator.share({
          title: 'My EYV Profile Picture',
          text: 'Check out my new profile picture created with EYV Support!',
          files: [file]
        });
      } catch (error) {
        // Fallback to download if sharing fails
        downloadProcessedImage();
      }
    } else {
      // Fallback to download if Web Share API is not available
      downloadProcessedImage();
    }
  }, [processedImage, downloadProcessedImage]);

  const startOver = useCallback(() => {
    setCurrentStep('upload');
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
  }, []);

  return {
    currentStep,
    originalImage,
    processedImage,
    isProcessing,
    processImage,
    proceedToDownload,
    downloadProcessedImage,
    shareImage,
    startOver
  };
}

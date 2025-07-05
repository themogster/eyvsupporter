import { useState, useCallback, useMemo } from 'react';
import { ImageProcessor, ProcessedImage, ImageTransform, validateImageFile, downloadImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

export type Step = 'upload' | 'preview' | 'download';

export function useImageProcessor() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transform, setTransform] = useState<ImageTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Create a stable processor instance
  const processor = useMemo(() => {
    console.log('Creating new ImageProcessor instance');
    try {
      const instance = new ImageProcessor();
      console.log('ImageProcessor created successfully');
      return instance;
    } catch (error) {
      console.error('Failed to create ImageProcessor:', error);
      throw error;
    }
  }, []);

  const setLogo = useCallback(async (file: File) => {
    // Validate SVG file
    if (!file.type.includes('svg') && !file.type.includes('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an SVG or image file for the logo",
        variant: "destructive",
      });
      return;
    }

    try {
      await processor.setLogo(file);
      setLogoFile(file);
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been set successfully!",
      });
      
      // Reprocess current image with new logo if one exists
      if (originalImage) {
        setIsProcessing(true);
        const result = await processor.processImage(originalImage, transform);
        setProcessedImage(result);
        setIsProcessing(false);
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    }
  }, [processor, toast, originalImage, transform]);

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

    if (navigator.share) {
      try {
        const file = new File([processedImage.blob], 'eyv-profile-picture.png', { type: 'image/png' });
        const shareData = {
          title: 'My EYV Profile Picture',
          text: 'Check out my new profile picture created with EYV Support!',
          files: [file]
        };
        
        // Check if files can be shared before attempting
        if ('canShare' in navigator && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback if files cannot be shared
          downloadProcessedImage();
        }
      } catch (error) {
        // Fallback to download if sharing fails
        downloadProcessedImage();
      }
    } else {
      // Fallback to download if Web Share API is not available
      downloadProcessedImage();
    }
  }, [processedImage, downloadProcessedImage]);

  const updateTransform = useCallback(async (newTransform: ImageTransform) => {
    if (!originalImage) {
      toast({
        title: "Transform Failed",
        description: "No original image available for reprocessing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processor.reprocessWithTransform(newTransform);
      setProcessedImage(result);
      setTransform(newTransform);
    } catch (error) {
      toast({
        title: "Transform Failed",
        description: error instanceof Error ? error.message : "Failed to apply transform",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, processor, toast]);

  const startOver = useCallback(() => {
    setCurrentStep('upload');
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  return {
    currentStep,
    originalImage,
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
  };
}

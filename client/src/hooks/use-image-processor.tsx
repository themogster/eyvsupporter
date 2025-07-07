import { useState, useCallback, useMemo } from 'react';
import { ImageProcessor, ProcessedImage, ImageTransform, ProcessingOptions, CurvedTextOption, TextColor, validateImageFile, downloadImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

export type Step = 'upload' | 'preview' | 'download' | 'thankyou';

export function useImageProcessor() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transform, setTransform] = useState<ImageTransform>({ scale: 1, offsetX: 0, offsetY: 0 });

  const [curvedText, setCurvedText] = useState<CurvedTextOption>('none');
  const [textColor, setTextColor] = useState<TextColor>('#ffffff');
  const [textPosition, setTextPosition] = useState<number>(270); // 270 degrees = top of circle
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
      const result = await processor.processImage(file, { transform, curvedText, textColor, textPosition });
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

  const proceedToThankYou = useCallback(() => {
    setCurrentStep('thankyou');
  }, []);

  const downloadProcessedImage = useCallback(async () => {
    if (processedImage) {
      try {
        // Convert blob to base64 for database storage
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(processedImage.blob);
        });
        
        const base64Image = await base64Promise;
        
        // Log download to database
        const response = await fetch('/api/downloads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileImage: base64Image,
            eyvMessage: curvedText || "none",
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to log download to database');
        }
        
        // Proceed with download
        downloadImage(processedImage.blob, 'eyv-profile-picture.png');
        toast({
          title: "Download Started",
          description: "Your EYV profile picture is being downloaded!",
        });
      } catch (error) {
        console.error('Error during download:', error);
        // Still allow download even if logging fails
        downloadImage(processedImage.blob, 'eyv-profile-picture.png');
        toast({
          title: "Download Started",
          description: "Your EYV profile picture is being downloaded!",
        });
      }
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

  const setCurvedTextOption = useCallback(async (option: CurvedTextOption) => {
    setCurvedText(option);
    
    // Reprocess current image with new curved text if one exists
    if (originalImage && processedImage) {
      setIsProcessing(true);
      try {

        const result = await processor.processImage(originalImage, { transform, curvedText: option, textColor, textPosition });
        setProcessedImage(result);
      } catch (error) {
        console.error('Failed to reprocess with curved text:', error);
        toast({
          title: "Processing Failed",
          description: "Failed to update the image with curved text",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [originalImage, processedImage, processor, transform, textColor, textPosition, toast]);

  const setTextColorOption = useCallback(async (color: TextColor) => {
    setTextColor(color);
    
    // Reprocess current image with new text color if one exists
    if (originalImage && processedImage) {
      setIsProcessing(true);
      try {
        const result = await processor.processImage(originalImage, { transform, curvedText, textColor: color, textPosition });
        setProcessedImage(result);
      } catch (error) {
        console.error('Failed to reprocess with text color:', error);
        toast({
          title: "Processing Failed",
          description: "Failed to update the image with new text color",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [originalImage, processedImage, processor, transform, curvedText, textPosition, toast]);

  const setTextPositionOption = useCallback(async (position: number) => {
    setTextPosition(position);
    
    // Reprocess current image with new text position if one exists
    if (originalImage && processedImage) {
      setIsProcessing(true);
      try {
        const result = await processor.processImage(originalImage, { transform, curvedText, textColor, textPosition: position });
        setProcessedImage(result);
      } catch (error) {
        console.error('Failed to reprocess with text position:', error);
        toast({
          title: "Processing Failed",
          description: "Failed to update the image with new text position",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [originalImage, processedImage, processor, transform, curvedText, textColor, toast]);

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
      const result = await processor.reprocessWithTransform(newTransform, { curvedText, textColor, textPosition });
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
  }, [originalImage, processor, toast, curvedText, textColor, textPosition]);

  const startOver = useCallback(() => {
    setCurrentStep('upload');
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
    setCurvedText('none');
    setTextColor('#ffffff');
    setTextPosition(30);
  }, []);

  return {
    currentStep,
    originalImage,
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
  };
}

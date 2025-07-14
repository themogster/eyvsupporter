import { useState, useCallback, useMemo } from 'react';
import { ImageProcessor, ProcessedImage, ImageTransform, ProcessingOptions, CurvedTextOption, TextColor, validateImageFile, downloadImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Message } from '@shared/schema';

export type Step = 'upload' | 'preview' | 'download' | 'thankyou';

export function useImageProcessor() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transform, setTransform] = useState<ImageTransform>({ scale: 1, offsetX: 0, offsetY: 0 });

  const [curvedText, setCurvedText] = useState<CurvedTextOption>('supporting');
  const [textColor, setTextColor] = useState<TextColor>('#ffffff');
  const [textPosition, setTextPosition] = useState<number>(270); // 270 degrees = top of circle
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch messages to resolve keys to actual text
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
  });

  // Helper function to resolve curved text key to actual message text
  const resolveMessageText = useCallback((key: string): string => {
    if (key === 'none') return 'none';
    const message = messages.find(m => m.key === key);
    const resolvedText = message ? message.messageText : key;
    console.log('Resolving message key:', key, 'to text:', resolvedText, 'from messages:', messages.length);
    return resolvedText;
  }, [messages]);

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

  // Helper function to log to database and create shareable URL
  const logToDatabase = useCallback(async (blob: Blob, messageKey: CurvedTextOption) => {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const base64Image = await base64Promise;
      
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileImage: base64Image,
          eyvMessage: messageKey || "none",
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Download response:', data);
        if (data.shareUrl) {
          console.log('Setting share URL:', data.shareUrl);
          setShareUrl(data.shareUrl);
        }
      } else {
        console.error('Failed to log to database');
      }
    } catch (error) {
      console.error('Database logging error:', error);
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

    // Wait for messages to load before processing
    if (messagesLoading) {
      toast({
        title: "Please Wait",
        description: "Loading message options...",
        variant: "default",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const actualMessageText = resolveMessageText(curvedText);
      console.log('Processing image with resolved text:', actualMessageText);
      const result = await processor.processImage(file, { transform, curvedText: actualMessageText, textColor, textPosition });
      setOriginalImage(file);
      setProcessedImage(result);
      
      // Log to database and create shareable URL immediately
      await logToDatabase(result.blob, curvedText);
      
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
  }, [toast, processor, transform, curvedText, textColor, textPosition, logToDatabase, resolveMessageText, messagesLoading]);

  const proceedToDownload = useCallback(() => {
    setCurrentStep('download');
  }, []);

  const proceedToThankYou = useCallback(() => {
    setCurrentStep('thankyou');
  }, []);

  const downloadProcessedImage = useCallback(async () => {
    if (processedImage) {
      // Simply download the image - database logging already happened during processing
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

  const setCurvedTextOption = useCallback(async (option: CurvedTextOption) => {
    setCurvedText(option);
    
    // Reprocess current image with new curved text if one exists
    if (originalImage && processedImage) {
      setIsProcessing(true);
      try {
        const actualMessageText = resolveMessageText(option);
        const result = await processor.processImage(originalImage, { transform, curvedText: actualMessageText, textColor, textPosition });
        setProcessedImage(result);
        
        // Regenerate shareable URL with updated image
        await logToDatabase(result.blob, option);
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
  }, [originalImage, processedImage, processor, transform, textColor, textPosition, toast, resolveMessageText, logToDatabase]);

  const setTextColorOption = useCallback(async (color: TextColor) => {
    setTextColor(color);
    
    // Reprocess current image with new text color if one exists
    if (originalImage && processedImage) {
      setIsProcessing(true);
      try {
        const actualMessageText = resolveMessageText(curvedText);
        const result = await processor.processImage(originalImage, { transform, curvedText: actualMessageText, textColor: color, textPosition });
        setProcessedImage(result);
        
        // Regenerate shareable URL with updated image
        await logToDatabase(result.blob, curvedText);
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
  }, [originalImage, processedImage, processor, transform, curvedText, textPosition, toast, resolveMessageText, logToDatabase]);

  const setTextPositionOption = useCallback(async (position: number) => {
    setTextPosition(position);
    
    // Reprocess current image with new text position if one exists
    if (originalImage && processedImage) {
      setIsProcessing(true);
      try {
        const actualMessageText = resolveMessageText(curvedText);
        const result = await processor.processImage(originalImage, { transform, curvedText: actualMessageText, textColor, textPosition: position });
        setProcessedImage(result);
        
        // Regenerate shareable URL with updated image
        await logToDatabase(result.blob, curvedText);
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
  }, [originalImage, processedImage, processor, transform, curvedText, textColor, toast, resolveMessageText, logToDatabase]);

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
      const actualMessageText = resolveMessageText(curvedText);
      const result = await processor.reprocessWithTransform(newTransform, { curvedText: actualMessageText, textColor, textPosition });
      setProcessedImage(result);
      setTransform(newTransform);
      
      // Regenerate shareable URL with updated image
      await logToDatabase(result.blob, curvedText);
    } catch (error) {
      toast({
        title: "Transform Failed",
        description: error instanceof Error ? error.message : "Failed to apply transform",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, processor, toast, curvedText, textColor, textPosition, logToDatabase]);

  const startOver = useCallback(() => {
    setCurrentStep('upload');
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
    setCurvedText('supporting');
    setTextColor('#ffffff');
    setTextPosition(270);
    setShareUrl(null);
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
  };
}

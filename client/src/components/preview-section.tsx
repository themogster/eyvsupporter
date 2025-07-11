import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ProcessedImage, ImageTransform, CurvedTextOption, TextColor } from '@/lib/image-utils';
import type { Message } from '@shared/schema';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getColorName(color: TextColor): string {
  const colorNames: Record<TextColor, string> = {
    '#ffffff': 'White',
    '#000000': 'Black', 
    '#ffff00': 'Yellow',
    '#ff0000': 'Red',
    '#00ff00': 'Green',
    '#0000ff': 'Blue',
    '#ff8c00': 'Orange',
    '#ff1493': 'Pink'
  };
  return colorNames[color];
}

interface PreviewSectionProps {
  processedImage: ProcessedImage | null;
  shareUrl: string | null;
  transform: ImageTransform;
  curvedText: CurvedTextOption;
  textColor: TextColor;
  textPosition: number;
  onTransformChange: (transform: ImageTransform) => void;
  onCurvedTextChange: (option: CurvedTextOption) => void;
  onTextColorChange: (color: TextColor) => void;
  onTextPositionChange: (position: number) => void;
  onProceedToDownload: () => void;
  onStartOver: () => void;
  isProcessing: boolean;
}

export function PreviewSection({ processedImage, shareUrl, transform, curvedText, textColor, textPosition, onTransformChange, onCurvedTextChange, onTextColorChange, onTextPositionChange, onProceedToDownload, onStartOver, isProcessing }: PreviewSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Fetch messages from the database
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

  useEffect(() => {
    if (processedImage && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 180, 180);
        ctx.drawImage(processedImage.canvas, 0, 0);
      }
    }
  }, [processedImage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

  }, []);

  // Global mouse handlers for proper drag functionality
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !canvasRef.current) return;
      

      
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const deltaX = (currentX - dragStart.x) / rect.width * 2; // Scale to -1 to 1 range
      const deltaY = (currentY - dragStart.y) / rect.height * 2;
      
      const newTransform: ImageTransform = {
        ...transform,
        offsetX: Math.max(-1, Math.min(1, transform.offsetX + deltaX)),
        offsetY: Math.max(-1, Math.min(1, transform.offsetY + deltaY))
      };
      

      onTransformChange(newTransform);
      
      setDragStart({ x: currentX, y: currentY });
    };

    const handleGlobalMouseUp = () => {

      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, transform, onTransformChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current || e.touches.length !== 1) return;
    
    e.preventDefault(); // Prevent scrolling
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    if (!isDragging || !canvasRef.current || e.touches.length !== 1) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    const deltaX = (currentX - dragStart.x) / rect.width * 2;
    const deltaY = (currentY - dragStart.y) / rect.height * 2;
    
    const newTransform: ImageTransform = {
      ...transform,
      offsetX: Math.max(-1, Math.min(1, transform.offsetX + deltaX)),
      offsetY: Math.max(-1, Math.min(1, transform.offsetY + deltaY))
    };
    
    onTransformChange(newTransform);
    
    setDragStart({ x: currentX, y: currentY });
  }, [isDragging, dragStart, transform, onTransformChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent any default behavior
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const scaleStep = 0.1;
    const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
    
    const newScale = Math.max(0.5, Math.min(3, transform.scale + delta));
    
    const newTransform: ImageTransform = {
      ...transform,
      scale: newScale
    };
    
    onTransformChange(newTransform);
  }, [transform, onTransformChange]);

  const handleCopyUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({
          title: "URL Copied!",
          description: "Share URL has been copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy URL to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-deep-purple text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Preview & Edit</h2>
      </div>
      {/* Canvas Preview Card */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
          <div className="relative inline-block">
            <div className="w-48 h-48 mx-auto relative">
              {processedImage ? (
                <canvas
                  ref={canvasRef}
                  width={180}
                  height={180}
                  className={`w-full h-full rounded-full shadow-lg cursor-move select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ imageRendering: 'crisp-edges', touchAction: 'none' }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Optimized for Facebook (180x180px)</p>
            <p className="text-xs mt-2 text-blue-600 dark:text-blue-400 font-medium">💡 Drag the image to reposition • Pinch or scroll to zoom</p>
          </div>
        </div>
      </Card>
      
      {shareUrl && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-blue-800 dark:text-blue-300 font-medium">Shareable URL Created!</p>
            </div>
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              Your profile picture is now available at a unique URL that you can share with others:
            </p>
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none"
              />
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="sm"
                className="ml-2 px-3 py-1 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-xs">
              Anyone with this URL can view and download your profile picture
            </p>
          </div>
        </Card>
      )}
      
      {/* Controls Card */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">

        {/* Curved Text Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">EYV Message</label>
          <Select value={curvedText} onValueChange={onCurvedTextChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose text option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No text</SelectItem>
              {messagesLoading ? (
                <SelectItem value="loading" disabled>Loading messages...</SelectItem>
              ) : (
                messages
                  .filter(message => message.key !== 'none') // Exclude the 'none' option from database
                  .map((message) => (
                    <SelectItem key={message.id} value={message.messageText}>
                      {message.displayText}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Text Color Picker */}
        {curvedText && curvedText !== 'none' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['#ffffff', '#000000', '#ffff00', '#ff0000', '#00ff00', '#0000ff', '#ff8c00', '#ff1493'] as TextColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => onTextColorChange(color)}
                  className={`w-12 h-12 rounded-full border-4 transition-all ${
                    textColor === color 
                      ? 'border-purple-600 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={getColorName(color)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text Position Slider */}
        {curvedText && curvedText !== 'none' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Position (0° = right, 90° = top, 180° = left, 270° = bottom)
            </label>
            <Slider
              value={[textPosition]}
              onValueChange={(value) => onTextPositionChange(value[0])}
              max={360}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: {textPosition}°
            </div>
          </div>
        )}

        {/* Zoom Control */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zoom ({(transform.scale * 100).toFixed(0)}%)
          </label>
          <Slider
            value={[transform.scale]}
            onValueChange={(value) => onTransformChange({ ...transform, scale: value[0] })}
            max={3}
            min={0.5}
            step={0.1}
            className="w-full"
          />
        </div>
      </Card>
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onProceedToDownload}
          className="w-full bg-deep-purple hover:bg-purple-700 text-white touch-manipulation"
          disabled={!processedImage}
          size="lg"
        >
          Continue to Download
        </Button>
        
        <Button
          onClick={onStartOver}
          variant="outline"
          className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-100"
          size="lg"
        >
          Upload Different Photo
        </Button>
      </div>
    </div>
  );
}
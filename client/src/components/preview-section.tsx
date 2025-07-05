import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ProcessedImage, ImageTransform, CurvedTextOption, TextColor } from '@/lib/image-utils';
import { ImageTransformControls } from './image-transform-controls';

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
  transform: ImageTransform;
  curvedText: CurvedTextOption;
  textColor: TextColor;
  textPosition: number;
  onTransformChange: (transform: ImageTransform) => void;
  onCurvedTextChange: (option: CurvedTextOption) => void;
  onTextColorChange: (color: TextColor) => void;
  onTextPositionChange: (position: number) => void;
  onProceedToDownload: () => void;
  isProcessing: boolean;
}

export function PreviewSection({ processedImage, transform, curvedText, textColor, textPosition, onTransformChange, onCurvedTextChange, onTextColorChange, onTextPositionChange, onProceedToDownload, isProcessing }: PreviewSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (processedImage && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 180, 180);
        ctx.drawImage(processedImage.canvas, 0, 0);
      }
    }
  }, [processedImage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-deep-purple text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
        <h2 className="text-lg font-semibold text-gray-800">Preview & Edit</h2>
      </div>

      <Card className="p-6">
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <div className="relative inline-block">
            <div className="w-48 h-48 mx-auto relative">
              {processedImage ? (
                <canvas
                  ref={canvasRef}
                  width={180}
                  height={180}
                  className="w-full h-full rounded-full shadow-lg"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full animate-pulse" />
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Optimized for Facebook (180x180px)</p>
            <p className="text-xs mt-1">Circular frame with EYV branding applied</p>
          </div>
        </div>

        {/* Curved Text Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Curved Text
          </label>
          <Select value={curvedText} onValueChange={onCurvedTextChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose text option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No text</SelectItem>
              <SelectItem value="supporting">I'M SUPPORTING EARLY YEARS VOICE</SelectItem>
              <SelectItem value="donated">I'VE DONATED, HAVE YOU?</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Color Picker */}
        {curvedText !== 'none' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
        {curvedText !== 'none' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <div className="text-xs text-gray-500 mt-1">
              Current: {textPosition}°
            </div>
          </div>
        )}


      </Card>

      {/* Transform Controls */}
      <ImageTransformControls
        transform={transform}
        onTransformChange={onTransformChange}
        isProcessing={isProcessing}
      />

      {/* Continue Button */}
      <Button
        onClick={onProceedToDownload}
        className="w-full bg-deep-purple hover:bg-purple-700 text-white touch-manipulation"
        disabled={!processedImage}
        size="lg"
      >
        Continue to Download
      </Button>
    </div>
  );
}
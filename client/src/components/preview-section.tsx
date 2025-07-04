import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProcessedImage, ImageTransform } from '@/lib/image-utils';
import { ImageTransformControls } from './image-transform-controls';

interface PreviewSectionProps {
  processedImage: ProcessedImage | null;
  transform: ImageTransform;
  onTransformChange: (transform: ImageTransform) => void;
  onProceedToDownload: () => void;
  isProcessing: boolean;
}

export function PreviewSection({ processedImage, transform, onTransformChange, onProceedToDownload, isProcessing }: PreviewSectionProps) {
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

        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Border Color</span>
            <div className="w-8 h-8 bg-deep-purple rounded-full border-2 border-white shadow-sm"></div>
          </div>
        </div>
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
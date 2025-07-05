import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, CheckCircle } from 'lucide-react';
import { ProcessedImage } from '@/lib/image-utils';

interface DownloadSectionProps {
  processedImage: ProcessedImage | null;
  onDownload: () => void;
  onShare: () => void;
  onStartOver: () => void;
}

export function DownloadSection({ processedImage, onDownload, onShare, onStartOver }: DownloadSectionProps) {
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
        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Ready to Download</h2>
      </div>

      {/* Show the processed image */}
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
            <p>Perfect for Facebook profile picture!</p>
            <p className="text-xs mt-1">180x180px • EYV branding included</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="text-green-800 font-medium">Your profile picture is ready!</p>
            <p className="text-green-700 text-sm">Optimized for Facebook with EYV branding</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={onDownload}
          className="w-full bg-deep-purple hover:bg-purple-700 text-white py-4 px-6 text-lg font-semibold shadow-lg touch-manipulation"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Profile Picture
        </Button>



        <Button
          onClick={onStartOver}
          variant="outline"
          className="w-full py-3 px-6 font-medium touch-manipulation"
          size="lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Create Another
        </Button>
      </div>
    </div>
  );
}

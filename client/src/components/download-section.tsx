import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, CheckCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { ProcessedImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

interface DownloadSectionProps {
  processedImage: ProcessedImage | null;
  shareUrl: string | null;
  onDownload: () => void;
  onShare: () => void;
  onStartOver: () => void;
  onProceedToThankYou: () => void;
}

export function DownloadSection({ processedImage, shareUrl, onDownload, onShare, onStartOver, onProceedToThankYou }: DownloadSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const handleDownload = () => {
    onDownload();
    // Transition to thank you stage after download
    setTimeout(() => {
      onProceedToThankYou();
    }, 500);
  };

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

  useEffect(() => {
    if (processedImage && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 400, 400);
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
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ready to Download</h2>
      </div>
      {/* Show the processed image */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
          <div className="relative inline-block">
            <div className="w-48 h-48 mx-auto relative">
              {processedImage ? (
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  className="w-full h-full rounded-full shadow-lg"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p>Perfect for Facebook profile picture!</p>
            <p className="text-xs mt-1">400x400px • EYV branding included</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
          <div>
            <p className="text-green-800 dark:text-green-300 font-medium">Your profile picture is ready!</p>
            <p className="text-green-700 dark:text-green-400 text-sm">Optimized for Facebook and supporting EYV</p>
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
      
      <div className="space-y-3">
        <Button
          onClick={handleDownload}
          className="w-full bg-deep-purple hover:bg-purple-700 text-white py-4 px-6 text-lg font-semibold shadow-lg touch-manipulation"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Profile Picture
        </Button>



        <Button
          onClick={onStartOver}
          variant="outline"
          className="w-full py-3 px-6 font-medium touch-manipulation bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          size="lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Create Another
        </Button>
      </div>
    </div>
  );
}

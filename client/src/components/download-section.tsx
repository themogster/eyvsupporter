import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, RotateCcw, CheckCircle } from 'lucide-react';

interface DownloadSectionProps {
  onDownload: () => void;
  onShare: () => void;
  onStartOver: () => void;
}

export function DownloadSection({ onDownload, onShare, onStartOver }: DownloadSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Ready to Download</h2>
      </div>

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
          onClick={onShare}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 font-medium touch-manipulation"
          size="lg"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Directly
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

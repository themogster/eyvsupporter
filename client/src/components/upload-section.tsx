import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { getCameraStream, captureImageFromVideo } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

export function UploadSection({ onImageSelect, isProcessing }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await getCameraStream();
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Could not access camera",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !cameraStream) return;

    try {
      const file = await captureImageFromVideo(videoRef.current);
      onImageSelect(file);
      stopCamera();
    } catch (error) {
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo from camera",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  if (showCamera) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-deep-purple text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <h2 className="text-lg font-semibold text-gray-800">Take Your Photo</h2>
        </div>

        <Card className="p-4">
          <video
            ref={videoRef}
            className="w-full rounded-lg mb-4"
            autoPlay
            playsInline
            muted
          />
          
          <div className="flex gap-2">
            <Button
              onClick={capturePhoto}
              className="flex-1 bg-deep-purple hover:bg-purple-700 touch-manipulation"
              size="lg"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
            
            <Button
              onClick={stopCamera}
              variant="outline"
              className="touch-manipulation"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-deep-purple text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
        <h2 className="text-lg font-semibold text-gray-800">Upload Your Photo</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* File Upload */}
        <Card
          className="cursor-pointer hover:border-deep-purple transition-colors touch-manipulation"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mb-3 mx-auto" />
            <p className="text-gray-600 font-medium mb-1">Choose from Gallery</p>
            <p className="text-sm text-gray-500">JPG, PNG, WEBP up to 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
        </Card>

        {/* Camera Capture */}
        <Button
          onClick={startCamera}
          variant="outline"
          className="w-full p-6 h-auto bg-gray-100 hover:bg-gray-200 touch-manipulation"
          disabled={isProcessing}
        >
          <div className="text-center">
            <Camera className="w-8 h-8 text-gray-600 mb-3 mx-auto" />
            <p className="text-gray-700 font-medium mb-1">Take Photo</p>
            <p className="text-sm text-gray-500">Use your camera</p>
          </div>
        </Button>
      </div>
    </div>
  );
}

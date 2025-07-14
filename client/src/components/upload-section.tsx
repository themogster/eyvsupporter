import { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { getCameraStream, captureImageFromVideo } from '@/lib/image-utils';


interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

export function UploadSection({ onImageSelect, isProcessing }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };



  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await getCameraStream();
      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Camera start error:', error);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !cameraStream) {
      console.error('Camera not ready');
      return;
    }

    try {
      const file = await captureImageFromVideo(videoRef.current);
      onImageSelect(file);
      stopCamera();
    } catch (error) {
      console.error('Camera capture error:', error);
    }
  };

  // Setup video element when camera stream is available
  useEffect(() => {
    if (cameraStream && videoRef.current && showCamera) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        video.play().then(() => {
          console.log('Video playing started');
        }).catch(err => {
          console.error('Video play failed:', err);
        });
      };
      
      const handlePlaying = () => {
        console.log('Video is playing');
        setVideoReady(true);
      };
      
      const handleError = (err: any) => {
        console.error('Video error:', err);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('error', handleError);
      };
    }
  }, [cameraStream, showCamera]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setVideoReady(false);
  };



  if (showCamera) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-deep-purple text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Take Your Photo</h2>
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
              disabled={!videoReady}
            >
              <Camera className="w-4 h-4 mr-2" />
              {videoReady ? 'Capture Photo' : 'Camera Loading...'}
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
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Upload Your Photo</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* File Upload */}
        <Card
          className="cursor-pointer hover:border-deep-purple transition-colors touch-manipulation bg-white dark:bg-gray-800"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-700">
            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-300 mb-3 mx-auto" />
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Choose from Gallery</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG, WEBP up to 10MB</p>
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



      </div>
    </div>
  );
}

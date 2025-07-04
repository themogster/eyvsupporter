import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
import { ImageTransform } from '@/lib/image-utils';

interface ImageTransformControlsProps {
  transform: ImageTransform;
  onTransformChange: (transform: ImageTransform) => void;
  isProcessing: boolean;
}

export function ImageTransformControls({ transform, onTransformChange, isProcessing }: ImageTransformControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleScaleChange = useCallback((value: number[]) => {
    const newTransform = { ...transform, scale: value[0] };
    onTransformChange(newTransform);
  }, [transform, onTransformChange]);

  const handleReset = useCallback(() => {
    onTransformChange({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [onTransformChange]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Scale sensitivity based on zoom level
    const sensitivity = 0.5 / transform.scale;
    
    const newTransform = {
      ...transform,
      offsetX: transform.offsetX + deltaX * sensitivity,
      offsetY: transform.offsetY + deltaY * sensitivity
    };
    
    onTransformChange(newTransform);
    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, dragStart, transform, onTransformChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Adjust Image</h3>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          disabled={isProcessing}
          className="touch-manipulation"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Scale Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Zoom</label>
          <span className="text-xs text-gray-500">{Math.round(transform.scale * 100)}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <ZoomOut className="w-4 h-4 text-gray-400" />
          <Slider
            value={[transform.scale]}
            onValueChange={handleScaleChange}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
            disabled={isProcessing}
          />
          <ZoomIn className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Drag to Position */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Move className="w-4 h-4 text-gray-600" />
          <label className="text-sm text-gray-600">Drag to reposition</label>
        </div>
        <div
          className="bg-gray-100 rounded-lg p-4 touch-manipulation select-none cursor-move"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="text-center text-sm text-gray-500">
            {isDragging ? 'Repositioning...' : 'Touch and drag to move image'}
          </div>
          <div className="text-center text-xs text-gray-400 mt-1">
            X: {Math.round(transform.offsetX)}, Y: {Math.round(transform.offsetY)}
          </div>
        </div>
      </div>

      {/* Quick Zoom Buttons */}
      <div className="flex space-x-2">
        <Button
          onClick={() => handleScaleChange([Math.max(0.5, transform.scale - 0.2)])}
          variant="outline"
          size="sm"
          disabled={isProcessing || transform.scale <= 0.5}
          className="flex-1 touch-manipulation"
        >
          <ZoomOut className="w-3 h-3 mr-1" />
          Zoom Out
        </Button>
        <Button
          onClick={() => handleScaleChange([Math.min(3, transform.scale + 0.2)])}
          variant="outline"
          size="sm"
          disabled={isProcessing || transform.scale >= 3}
          className="flex-1 touch-manipulation"
        >
          <ZoomIn className="w-3 h-3 mr-1" />
          Zoom In
        </Button>
      </div>
    </Card>
  );
}
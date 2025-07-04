export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 180;
    this.canvas.height = 180;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async processImage(imageFile: File): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Clear canvas
          this.ctx.clearRect(0, 0, 180, 180);
          
          // Calculate dimensions to crop to square and center the image
          const size = Math.min(img.width, img.height);
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          
          // Save context for clipping
          this.ctx.save();
          
          // Create circular clipping path
          this.ctx.beginPath();
          this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
          this.ctx.clip();
          
          // Draw the image, cropped to square and scaled to fit
          this.ctx.drawImage(
            img,
            offsetX, offsetY, size, size,  // Source rectangle (square crop)
            8, 8, 164, 164                 // Destination rectangle (leave space for border)
          );
          
          // Restore context to remove clipping
          this.ctx.restore();
          
          // Draw circular border
          this.ctx.beginPath();
          this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6B46C1';
          this.ctx.lineWidth = 8;
          this.ctx.stroke();
          
          // Draw EYV logo background circle
          this.ctx.beginPath();
          this.ctx.arc(146, 146, 18, 0, Math.PI * 2);
          this.ctx.fillStyle = 'white';
          this.ctx.fill();
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6B46C1';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          // Draw EYV text
          this.ctx.font = 'bold 12px Inter, sans-serif';
          this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6B46C1';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('EYV', 146, 146);
          
          // Convert to blob
          this.canvas.toBlob((blob) => {
            if (blob) {
              resolve({ canvas: this.canvas, blob });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png', 0.9);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Create object URL and load image
      const objectUrl = URL.createObjectURL(imageFile);
      img.src = objectUrl;
      
      // Clean up object URL when done
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        img.onload();
      };
    });
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

export function downloadImage(blob: Blob, filename: string = 'eyv-profile-picture.png') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPG, PNG, or WEBP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }
  
  return { valid: true };
}

export async function getCameraStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user', // Front camera for selfies
        width: { ideal: 1080 },
        height: { ideal: 1080 }
      }
    });
  } catch (error) {
    throw new Error('Camera access denied or not available');
  }
}

export function captureImageFromVideo(video: HTMLVideoElement): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob then file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('Failed to capture image from camera'));
        }
      }, 'image/png', 0.9);
    } catch (error) {
      reject(error);
    }
  });
}

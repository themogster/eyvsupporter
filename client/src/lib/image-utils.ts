export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

export interface ImageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private logoImage: HTMLImageElement | null = null;
  private logoLoadPromise: Promise<void>;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 180;
    this.canvas.height = 180;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Load default EYV logo and store the promise
    this.logoLoadPromise = this.loadDefaultLogo();
  }

  private async loadDefaultLogo(): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.logoImage = img;
        console.log('EYV logo loaded successfully:', {
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          src: img.src,
          complete: img.complete
        });
        console.log('logoImage reference set:', this.logoImage !== null);
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load EYV logo image:', error);
        reject(error);
      };
      // Load from public directory
      img.src = '/eyv-logo.svg';
      console.log('Started loading logo from:', img.src);
    });
  }

  async setLogo(logoFile: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.logoImage = img;
          resolve();
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(logoFile);
    });
  }

  async processImage(imageFile: File, transform?: ImageTransform): Promise<ProcessedImage> {
    // Wait for logo to load before processing
    try {
      await this.logoLoadPromise;
      console.log('Logo load promise resolved, logoImage state:', this.logoImage !== null);
    } catch (error) {
      console.warn('Logo failed to load, proceeding with text fallback', error);
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Store original image for repositioning after it loads
          this.originalImage = img;
          
          // Clear canvas
          this.ctx.clearRect(0, 0, 180, 180);
          
          // Use transform values or defaults
          const scale = transform?.scale || 1;
          const userOffsetX = transform?.offsetX || 0;
          const userOffsetY = transform?.offsetY || 0;
          
          // Calculate dimensions to crop to square and center the image
          const size = Math.min(img.width, img.height);
          const baseCenterX = (img.width - size) / 2;
          const baseCenterY = (img.height - size) / 2;
          
          // Apply user transforms
          const sourceSize = size / scale;
          const sourceX = baseCenterX + userOffsetX - (sourceSize - size) / 2;
          const sourceY = baseCenterY + userOffsetY - (sourceSize - size) / 2;
          
          // Save context for clipping
          this.ctx.save();
          
          // Create circular clipping path
          this.ctx.beginPath();
          this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
          this.ctx.clip();
          
          // Draw the image with transforms applied
          this.ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize,  // Source rectangle (transformed)
            8, 8, 164, 164                             // Destination rectangle (leave space for border)
          );
          
          // Restore context to remove clipping
          this.ctx.restore();
          
          // Draw circular border
          this.ctx.beginPath();
          this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6E1284';
          this.ctx.lineWidth = 8;
          this.ctx.stroke();
          
          // Draw logo background circle
          this.ctx.beginPath();
          this.ctx.arc(146, 146, 18, 0, Math.PI * 2);
          this.ctx.fillStyle = 'white';
          this.ctx.fill();
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6E1284';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          // Draw logo image or fallback text
          if (this.logoImage) {
            console.log('Drawing EYV logo image', {
              logoWidth: this.logoImage.width,
              logoHeight: this.logoImage.height,
              naturalWidth: this.logoImage.naturalWidth,
              naturalHeight: this.logoImage.naturalHeight
            });
            // Draw uploaded logo SVG - make it larger and more visible
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(146, 146, 16, 0, Math.PI * 2);
            this.ctx.clip();
            // Draw logo larger to ensure visibility
            this.ctx.drawImage(this.logoImage, 126, 126, 40, 40);
            this.ctx.restore();
            
            // Also draw without clipping for debugging
            console.log('Also drawing logo without clipping for debugging');
            this.ctx.globalAlpha = 0.5;
            this.ctx.drawImage(this.logoImage, 10, 10, 50, 50);
            this.ctx.globalAlpha = 1.0;
          } else {
            console.log('Drawing fallback EYV text - logoImage is null');
            // Fallback to EYV text
            this.ctx.font = 'bold 12px Inter, sans-serif';
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6E1284';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('EYV', 146, 146);
          }
          
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
      const originalOnLoad = img.onload;
      img.onload = (event) => {
        URL.revokeObjectURL(objectUrl);
        if (originalOnLoad) {
          originalOnLoad.call(img, event);
        }
      };
    });
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  async reprocessWithTransform(transform: ImageTransform): Promise<ProcessedImage> {
    if (!this.originalImage) {
      throw new Error('No original image available for reprocessing');
    }

    // Wait for logo to load before reprocessing
    try {
      await this.logoLoadPromise;
    } catch (error) {
      console.warn('Logo failed to load, proceeding with text fallback');
    }

    const img = this.originalImage;
    return new Promise((resolve, reject) => {
      try {
        // Clear canvas
        this.ctx.clearRect(0, 0, 180, 180);
        
        // Use transform values
        const scale = transform.scale;
        const userOffsetX = transform.offsetX;
        const userOffsetY = transform.offsetY;
        
        // Calculate dimensions to crop to square and center the image
        const size = Math.min(img.width, img.height);
        const baseCenterX = (img.width - size) / 2;
        const baseCenterY = (img.height - size) / 2;
        
        // Apply user transforms
        const sourceSize = size / scale;
        const sourceX = baseCenterX + userOffsetX - (sourceSize - size) / 2;
        const sourceY = baseCenterY + userOffsetY - (sourceSize - size) / 2;
        
        // Save context for clipping
        this.ctx.save();
        
        // Create circular clipping path
        this.ctx.beginPath();
        this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw the image with transforms applied
        this.ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize,  // Source rectangle (transformed)
          8, 8, 164, 164                             // Destination rectangle (leave space for border)
        );
        
        // Restore context to remove clipping
        this.ctx.restore();
        
        // Draw circular border
        this.ctx.beginPath();
        this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6E1284';
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        
        // Draw logo background circle
        this.ctx.beginPath();
        this.ctx.arc(146, 146, 18, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6E1284';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw logo image or fallback text
        if (this.logoImage) {
          console.log('Drawing EYV logo image (reprocess)');
          // Draw uploaded logo SVG
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(146, 146, 16, 0, Math.PI * 2);
          this.ctx.clip();
          this.ctx.drawImage(this.logoImage, 130, 130, 32, 32);
          this.ctx.restore();
        } else {
          console.log('Drawing fallback EYV text (reprocess)');
          // Fallback to EYV text
          this.ctx.font = 'bold 12px Inter, sans-serif';
          this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#6E1284';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('EYV', 146, 146);
        }
        
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
    });
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

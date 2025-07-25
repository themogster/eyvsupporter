export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

export interface ImageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export type CurvedTextOption = string;

export type TextColor = '#ffffff' | '#000000' | '#ffff00' | '#ff0000' | '#00ff00' | '#0000ff' | '#ff8c00' | '#ff1493';

export interface ProcessingOptions {
  transform?: ImageTransform;
  curvedText?: CurvedTextOption;
  textColor?: TextColor;
  textPosition?: number; // 0-360 degrees around the circle
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private logoImage: HTMLImageElement | null = null;
  private logoLoadPromise: Promise<void>;

  constructor() {
    console.log('ImageProcessor constructor called');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Start loading the logo immediately
    console.log('About to start loading default logo');
    this.logoLoadPromise = this.loadDefaultLogo();
    console.log('Default logo loading started');
  }

  private async loadDefaultLogo(): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";  // Add this for better compatibility
      
      img.onload = () => {
        this.logoImage = img;
        console.log('EYV PNG logo loaded successfully, dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('Failed to load EYV logo image:', error);
        reject(error);
      };
      
      // Load PNG logo from public directory
      img.src = '/logo.png';
      console.log('Started loading PNG logo from:', img.src);
    });
  }

  private drawCurvedText(text: string, centerX: number, centerY: number, radius: number, color: TextColor = '#ffffff', startPosition: number = 30): void {
    const fontSize = 18;
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Calculate the arc length and angle per character
    const chars = text.split('');
    const totalChars = chars.length;
    
    // Position text around the circle - adjust arc based on text length for better spacing
    const baseArcAngle = Math.PI * 0.8; // 144 degrees base (more spread for larger canvas)
    const spacingMultiplier = totalChars > 15 ? 1.2 : 1.0; // Less aggressive spacing for larger canvas
    const totalArcAngle = baseArcAngle * spacingMultiplier;
    const angleStep = totalArcAngle / (totalChars - 1);
    // Convert startPosition from degrees to radians and adjust for circle coordinate system
    const startAngle = (startPosition * Math.PI / 180) - (totalArcAngle / 2);
    
    // Draw each character
    for (let i = 0; i < totalChars; i++) {
      const char = chars[i];
      if (char === ' ') continue; // Skip spaces but keep position
      
      const angle = startAngle + (i * angleStep);
      
      // Calculate position
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Save context and position/rotate for character
      this.ctx.save();
      this.ctx.translate(x, y);
      // Rotate so text reads naturally along the curve (tangent to circle)
      this.ctx.rotate(angle + Math.PI / 2);
      this.ctx.fillText(char, 0, 0);
      this.ctx.restore();
    }
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

  async processImage(imageFile: File, options?: ProcessingOptions): Promise<ProcessedImage> {
    // Wait for logo to load before processing
    try {
      await this.logoLoadPromise;
      // Logo loaded successfully
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
          this.ctx.clearRect(0, 0, 400, 400);
          
          // Extract transform and curved text options
          const imageTransform = options?.transform || { scale: 1, offsetX: 0, offsetY: 0 };
          const curvedText = options?.curvedText || 'none';
          const textColor = options?.textColor || '#ffffff';
          const textPosition = options?.textPosition || 270; // Default to top (270 degrees)
          
          // Use transform values
          const scale = imageTransform.scale;
          const userOffsetX = imageTransform.offsetX * 50; // Convert normalized offset to pixels
          const userOffsetY = imageTransform.offsetY * 50;
          
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
          
          // Create circular clipping path (scaled for 400x400)
          this.ctx.beginPath();
          this.ctx.arc(200, 200, 182, 0, Math.PI * 2);
          this.ctx.clip();
          
          // Draw the image with transforms applied (scaled for 400x400)
          this.ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize,  // Source rectangle (transformed)
            18, 18, 364, 364                           // Destination rectangle (leave space for border)
          );
          
          // Restore context to remove clipping
          this.ctx.restore();
          
          // Draw circular border - thicker to eliminate transparent ring (scaled for 400x400)
          this.ctx.beginPath();
          this.ctx.arc(200, 200, 182, 0, Math.PI * 2);
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
          this.ctx.lineWidth = 27;
          this.ctx.stroke();
          
          // Draw logo background circle - positioned more inward and larger (scaled for 400x400)
          this.ctx.beginPath();
          this.ctx.arc(306, 306, 53, 0, Math.PI * 2);
          this.ctx.fillStyle = 'white';
          this.ctx.fill();
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
          this.ctx.lineWidth = 4;
          this.ctx.stroke();
          
          // Draw logo image or fallback text
          console.log('About to draw logo, logoImage exists:', !!this.logoImage);
          if (this.logoImage) {
            console.log('Drawing PNG logo in circle');
            // Draw PNG logo in the white circle - larger and more inward (scaled for 400x400)
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(306, 306, 49, 0, Math.PI * 2);
            this.ctx.clip();
            // Center the logo in the circle - larger size (scaled 44x44 to 98x98)
            this.ctx.drawImage(this.logoImage, 257, 257, 98, 98);
            this.ctx.restore();
            console.log('PNG logo drawn successfully');
          } else {
            console.log('logoImage is null, drawing fallback text');
            // Fallback to EYV text (scaled font)
            this.ctx.font = 'bold 31px Inter, sans-serif';
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('EYV', 306, 306);
          }
          
          // Draw curved text if specified
          if (curvedText && curvedText !== 'none') {
            console.log('Drawing curved text:', curvedText);
            this.drawCurvedText(curvedText, 200, 200, 144, textColor, textPosition); // Center at 200,200 with radius 144
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

  async reprocessWithTransform(transform: ImageTransform, options?: Pick<ProcessingOptions, 'curvedText' | 'textColor' | 'textPosition'>): Promise<ProcessedImage> {
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
        // Clear canvas (scaled for 400x400)
        this.ctx.clearRect(0, 0, 400, 400);
        
        // Use transform values
        const scale = transform.scale;
        const userOffsetX = transform.offsetX * 50; // Convert normalized offset to pixels
        const userOffsetY = transform.offsetY * 50;
        
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
        
        // Create circular clipping path (scaled for 400x400)
        this.ctx.beginPath();
        this.ctx.arc(200, 200, 182, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw the image with transforms applied (scaled for 400x400)
        this.ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize,  // Source rectangle (transformed)
          18, 18, 364, 364                           // Destination rectangle (leave space for border)
        );
        
        // Restore context to remove clipping
        this.ctx.restore();
          
        // Draw circular border - thicker to eliminate transparent ring (scaled for 400x400)
        this.ctx.beginPath();
        this.ctx.arc(200, 200, 182, 0, Math.PI * 2);
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
        this.ctx.lineWidth = 27;
        this.ctx.stroke();
        
        // Draw logo background circle - positioned more inward and larger (scaled for 400x400)
        this.ctx.beginPath();
        this.ctx.arc(306, 306, 53, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw logo image or fallback text
        if (this.logoImage) {
          // Draw PNG logo in the white circle - larger and more inward (scaled for 400x400)
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(306, 306, 49, 0, Math.PI * 2);
          this.ctx.clip();
          // Center the logo in the circle - larger size (scaled 44x44 to 98x98)
          this.ctx.drawImage(this.logoImage, 257, 257, 98, 98);
          this.ctx.restore();
        } else {
          // Fallback to EYV text (scaled font)
          this.ctx.font = 'bold 31px Inter, sans-serif';
          this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('EYV', 306, 306);
        }
        
        // Draw curved text if specified
        if (options) {
          const curvedText = options.curvedText || 'none';
          const textColor = options.textColor || '#ffffff';
          const textPosition = options.textPosition || 270;
          
          console.log('reprocessWithTransform - curvedText:', curvedText, 'textColor:', textColor, 'textPosition:', textPosition);
          
          if (curvedText && curvedText !== 'none') {
            console.log('reprocessWithTransform - Drawing curved text:', curvedText);
            this.drawCurvedText(curvedText, 200, 200, 144, textColor, textPosition);
          }
        } else {
          console.log('reprocessWithTransform - No options provided, skipping text');
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
    // First check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported in this browser');
    }

    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user', // Front camera for selfies
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 }
      }
    });
  } catch (error: any) {
    console.error('Camera access error:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera access denied. Please allow camera permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Camera is already in use by another application.');
    } else {
      throw new Error('Camera access failed: ' + (error.message || 'Unknown error'));
    }
  }
}

export function captureImageFromVideo(video: HTMLVideoElement): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error('Video not ready for capture'));
        return;
      }
      
      // Check if video is playing
      if (video.paused || video.ended) {
        reject(new Error('Video is not playing'));
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob then file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/png', 0.9);
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown capture error'));
    }
  });
}

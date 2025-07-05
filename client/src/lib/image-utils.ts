export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

export interface ImageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export type CurvedTextOption = 'none' | 'supporting' | 'donated';

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
    this.canvas.width = 180;
    this.canvas.height = 180;
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
    const fontSize = 10;
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Calculate the arc length and angle per character
    const chars = text.split('');
    const totalChars = chars.length;
    
    // Position text around the circle - adjust arc based on text length for better spacing
    const baseArcAngle = Math.PI * 0.67; // 120 degrees base
    const spacingMultiplier = totalChars > 15 ? 1.4 : 1.0; // More spacing for longer text
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
          this.ctx.clearRect(0, 0, 180, 180);
          
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
          
          // Draw circular border - thicker to eliminate transparent ring
          this.ctx.beginPath();
          this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
          this.ctx.lineWidth = 12;
          this.ctx.stroke();
          
          // Draw logo background circle - positioned more inward and larger
          this.ctx.beginPath();
          this.ctx.arc(138, 138, 24, 0, Math.PI * 2);
          this.ctx.fillStyle = 'white';
          this.ctx.fill();
          this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          
          // Draw logo image or fallback text
          console.log('About to draw logo, logoImage exists:', !!this.logoImage);
          if (this.logoImage) {
            console.log('Drawing PNG logo in circle');
            // Draw PNG logo in the white circle - larger and more inward
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(138, 138, 22, 0, Math.PI * 2);
            this.ctx.clip();
            // Center the logo in the circle - larger size (44x44 instead of 32x32)
            this.ctx.drawImage(this.logoImage, 116, 116, 44, 44);
            this.ctx.restore();
            console.log('PNG logo drawn successfully');
          } else {
            console.log('logoImage is null, drawing fallback text');
            // Fallback to EYV text
            this.ctx.font = 'bold 14px Inter, sans-serif';
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('EYV', 138, 138);
          }
          
          // Draw curved text if specified
          if (curvedText !== 'none') {
            let textToDraw = '';
            if (curvedText === 'supporting') {
              textToDraw = "I'M SUPPORTING EARLY YEARS VOICE";
            } else if (curvedText === 'donated') {
              textToDraw = "I'VE DONATED, HAVE YOU?";
            }
            
            if (textToDraw) {
              console.log('Drawing curved text:', textToDraw);
              this.drawCurvedText(textToDraw, 90, 90, 65, textColor, textPosition); // Center at 90,90 with radius 65
            }
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
        
        // Create circular clipping path
        this.ctx.beginPath();
        this.ctx.arc(90, 90, 78, 0, Math.PI * 2);
        this.ctx.clip();
        
        // Draw the image with transforms applied
        this.ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize,  // Source rectangle (transformed)
          12, 12, 156, 156                           // Destination rectangle (leave space for border)
        );
        
        // Restore context to remove clipping
        this.ctx.restore();
          
        // Draw circular border - thicker to eliminate transparent ring
        this.ctx.beginPath();
        this.ctx.arc(90, 90, 82, 0, Math.PI * 2);
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
        this.ctx.lineWidth = 12;
        this.ctx.stroke();
        
        // Draw logo background circle - positioned more inward and larger
        this.ctx.beginPath();
        this.ctx.arc(138, 138, 24, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw logo image or fallback text
        if (this.logoImage) {
          // Draw PNG logo in the white circle - larger and more inward
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(138, 138, 22, 0, Math.PI * 2);
          this.ctx.clip();
          // Center the logo in the circle - larger size (44x44 instead of 32x32)
          this.ctx.drawImage(this.logoImage, 116, 116, 44, 44);
          this.ctx.restore();
        } else {
          // Fallback to EYV text
          this.ctx.font = 'bold 14px Inter, sans-serif';
          this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--deep-purple') || '#502185';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('EYV', 138, 138);
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

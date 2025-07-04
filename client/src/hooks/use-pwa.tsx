import { useState, useEffect, useCallback } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);

  // Check if app is already installed
  useEffect(() => {
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for iOS fullscreen mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e as any);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA: Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: New version available');
                  // You could show a notification here
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('PWA: Service Worker registration failed:', error);
        });
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        return true;
      } else {
        console.log('PWA: User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
      return false;
    } finally {
      // Clear the saved prompt since it can only be used once
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  }, [installPrompt]);

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      return {
        platform: 'iOS Safari',
        steps: [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ]
      };
    } else if (navigator.userAgent.includes('Chrome')) {
      return {
        platform: 'Chrome',
        steps: [
          'Tap the menu (three dots) in the top right',
          'Tap "Add to Home screen" or "Install app"',
          'Tap "Add" or "Install" to confirm'
        ]
      };
    } else {
      return {
        platform: 'Browser',
        steps: [
          'Look for an "Install" or "Add to Home Screen" option in your browser menu',
          'Follow the prompts to install the app'
        ]
      };
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOffline,
    installApp,
    getInstallInstructions,
    canPromptInstall: !!installPrompt
  };
}
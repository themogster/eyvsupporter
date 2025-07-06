import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FacebookUser {
  id: string;
  name: string;
  picture: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
}

export function useFacebookAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Facebook SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if FB is already loaded
    if (window.FB) {
      setIsInitialized(true);
      return;
    }

    // Set up Facebook SDK initialization
    window.fbAsyncInit = function() {
      const appId = import.meta.env.VITE_FACEBOOK_APP_ID || 'your-app-id';
      
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });

      console.log('Facebook SDK initialized with App ID:', appId);
      setIsInitialized(true);
    };

    // Load SDK if not already present
    const existingScript = document.getElementById('facebook-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.head.appendChild(script);
    }
  }, []);

  const loginAndGetProfilePicture = useCallback(async (): Promise<string | null> => {
    if (!isInitialized || !window.FB) {
      setError('Facebook SDK not initialized');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve, reject) => {
        window.FB.login((response: any) => {
          if (response.authResponse) {
            console.log('Facebook login successful:', response);
            
            // Get user info including profile picture
            window.FB.api('/me', { fields: 'name,picture.width(500).height(500)' }, (userResponse: FacebookUser) => {
              if (userResponse && userResponse.picture) {
                console.log('Facebook user data:', userResponse);
                resolve(userResponse.picture.data.url);
              } else {
                reject(new Error('Failed to get user profile picture'));
              }
            });
          } else {
            reject(new Error('Facebook login was cancelled or failed'));
          }
        }, { scope: 'public_profile' });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login with Facebook';
      setError(errorMessage);
      console.error('Facebook login error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const getProfilePictureUrl = useCallback(async (userId?: string): Promise<string | null> => {
    if (!isInitialized || !window.FB) {
      setError('Facebook SDK not initialized');
      return null;
    }

    const targetUserId = userId || 'me';
    
    return new Promise((resolve, reject) => {
      window.FB.api(`/${targetUserId}/picture`, { 
        redirect: false, 
        width: 500, 
        height: 500 
      }, (response: any) => {
        if (response && response.data && response.data.url) {
          resolve(response.data.url);
        } else {
          reject(new Error('Failed to get profile picture URL'));
        }
      });
    });
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    loginAndGetProfilePicture,
    getProfilePictureUrl
  };
}
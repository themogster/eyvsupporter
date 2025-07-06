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

    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    console.log('Environment check - Facebook App ID:', appId ? 'Found' : 'Not found');
    console.log('All env vars:', import.meta.env);

    // Check if FB is already loaded
    if (window.FB) {
      console.log('Facebook SDK already loaded');
      setIsInitialized(true);
      return;
    }

    // Set up Facebook SDK initialization
    window.fbAsyncInit = function() {
      console.log('fbAsyncInit called, App ID:', appId);
      
      if (!appId) {
        console.error('Facebook App ID not found in environment variables');
        setError('Facebook App ID not configured');
        return;
      }
      
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });

        console.log('Facebook SDK initialized successfully with App ID:', appId);
        setIsInitialized(true);
      } catch (error) {
        console.error('Facebook SDK initialization error:', error);
        setError('Failed to initialize Facebook SDK');
      }
    };

    // Load SDK if not already present
    const existingScript = document.getElementById('facebook-jssdk');
    if (!existingScript) {
      console.log('Loading Facebook SDK script...');
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.onload = () => console.log('Facebook SDK script loaded');
      script.onerror = () => console.error('Failed to load Facebook SDK script');
      document.head.appendChild(script);
    } else {
      console.log('Facebook SDK script already exists');
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
import { useState, useEffect, useRef, useCallback } from 'react';

const GoogleAuthButton = ({ onSuccess, onError, mode = 'signin' }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const buttonRef = useRef(null);

  const handleCredentialResponse = useCallback(async (response) => {
    setLoading(true);
    
    try {
      if (response.credential) {
        await onSuccess(response.credential);
      } else {
        console.error('No credential received from Google');
        onError('No credential received from Google');
      }
    } catch (error) {
      console.error('Credential response error:', error);
      onError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
      // Re-render button after authentication attempt
      setTimeout(() => {
        if (googleLoaded) {
          initializeGoogleButton();
        }
      }, 100);
    }
  }, [onSuccess, onError, googleLoaded]);

  const initializeGoogleButton = useCallback(() => {
    if (!window.google || !window.google.accounts) return;
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('No Google Client ID found');
      onError('Google Client ID not configured');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
        
        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: buttonRef.current.offsetWidth || 300,
            text: mode === 'signin' ? 'signin_with' : 'signup_with',
          }
        );
      }
    } catch (error) {
      console.error('Google initialization error:', error);
      onError('Failed to initialize Google authentication');
    }
  }, [mode, onError, handleCredentialResponse]);

  // Load Google Script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        setGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts) {
          setGoogleLoaded(true);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Google Script');
        onError('Failed to load Google authentication');
      };
      
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (!existingScript) {
        document.head.appendChild(script);
      }
    };

    loadGoogleScript();
  }, [onError]);

  // Initialize button when Google is loaded or mode changes
  useEffect(() => {
    if (googleLoaded) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        initializeGoogleButton();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [googleLoaded, initializeGoogleButton]);

  // Refresh button function that can be called externally
  const refreshButton = useCallback(() => {
    if (googleLoaded) {
      initializeGoogleButton();
    }
  }, [googleLoaded, initializeGoogleButton]);

  // Expose refresh function through ref (optional)
  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.refreshGoogleButton = refreshButton;
    }
  }, [refreshButton]);

  if (!googleLoaded) {
    return (
      <div className="w-full">
        <button
          disabled
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-3"></div>
          Loading Google...
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Google's official button */}
      <div ref={buttonRef} className="w-full min-h-[44px]"></div>
      
      {/* Fallback manual button (optional) */}
      {loading && (
        <div className="w-full flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Authenticating...</span>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;

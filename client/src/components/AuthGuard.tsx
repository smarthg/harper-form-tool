import { useUser, useAuth } from '@clerk/clerk-react';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // Check for developer mode
  useEffect(() => {
    // Query the server to check for developer mode
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        if (data.developerMode === true) {
          console.log('Developer mode is enabled, bypassing authentication');
          setIsDeveloperMode(true);
        }
      })
      .catch(error => {
        console.error('Error checking developer mode:', error);
      });
  }, []);

  useEffect(() => {
    // Only redirect to sign-in if developer mode is disabled and user is not signed in
    if (isLoaded && !isSignedIn && !isDeveloperMode) {
      setLocation('/sign-in');
    }
  }, [isLoaded, isSignedIn, setLocation, isDeveloperMode]);

  // Show loading spinner while checking auth status
  if (!isLoaded && !isDeveloperMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access if signed in OR in developer mode
  if (!isSignedIn && !isDeveloperMode) {
    return null;
  }

  return <>{children}</>;
}
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useContext, useState, useEffect } from 'react';
import { ThemeProviderContext } from './ThemeProvider';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(ThemeProviderContext);
  const theme = context ? context.theme : 'light';
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First try to get the key from environment variables
    const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
    
    if (envKey) {
      setPublishableKey(envKey);
      setLoading(false);
      return;
    }
    
    // If not available in env, fetch from API
    fetch('/api/config')
      .then(response => response.json())
      .then(data => {
        if (data.clerkPublishableKey) {
          setPublishableKey(data.clerkPublishableKey);
        } else {
          console.error('No Clerk publishable key available from API');
        }
      })
      .catch(error => {
        console.error('Failed to fetch Clerk configuration:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Show loading state while we're getting the key
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>;
  }

  // If we don't have a key, show a helpful error message
  if (!publishableKey) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md p-8 bg-destructive/10 text-destructive rounded-lg">
        <h2 className="text-xl font-bold mb-4">Configuration Error</h2>
        <p className="mb-4">
          Unable to initialize authentication. Please make sure Clerk API keys are properly configured.
        </p>
        <p className="text-sm">
          If you're the developer, check that CLERK_PUBLISHABLE_KEY is set in your environment.
        </p>
      </div>
    </div>;
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
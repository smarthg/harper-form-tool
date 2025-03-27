import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useContext } from 'react';
import { ThemeProviderContext } from './ThemeProvider';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(ThemeProviderContext);
  const theme = context ? context.theme : 'light';

  return (
    <BaseClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { useLocation } from "wouter";

export default function SignIn() {
  const [location, setLocation] = useLocation();
  const isCallback = location.includes('sso-callback');

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className={`w-full ${!isCallback ? 'max-w-md p-8 space-y-8 bg-background rounded-lg shadow-lg' : ''}`}>
        {!isCallback && (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Sign In</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back to Voice Form Editor
            </p>
          </div>
        )}
        
        <ClerkSignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up"
          afterSignInUrl="/"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
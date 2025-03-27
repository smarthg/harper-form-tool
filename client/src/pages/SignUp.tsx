import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { useLocation } from "wouter";

export default function SignUp() {
  const [_, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-md p-8 space-y-8 bg-background rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up to use Voice Form Editor
          </p>
        </div>
        
        <ClerkSignUp 
          routing="path" 
          path="/sign-up" 
          signInUrl="/sign-in"
          afterSignUpUrl="/"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
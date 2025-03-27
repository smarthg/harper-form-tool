import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { 
  SignIn, 
  SignUp, 
  SignedIn, 
  SignedOut, 
  useAuth, 
  RedirectToSignIn
} from "@clerk/clerk-react";
import NotFound from "@/pages/not-found";
import FormEditor from "@/pages/FormEditor";

// Protected route component to ensure user is authenticated
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) => {
  return (
    <>
      <SignedIn>
        <Component {...rest} />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/sign-in">
        <SignIn routing="path" path="/sign-in" />
      </Route>
      <Route path="/sign-up">
        <SignUp routing="path" path="/sign-up" />
      </Route>
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={FormEditor} />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

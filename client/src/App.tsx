import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@/components/ClerkProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";

import NotFound from "@/pages/not-found";
import FormEditor from "@/pages/FormEditor";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";

function Router() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      
      {/* Protected routes */}
      <Route path="/">
        <AuthGuard>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <FormEditor />
            </main>
          </div>
        </AuthGuard>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;

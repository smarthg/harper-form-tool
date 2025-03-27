import { UserButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const AuthHeader = () => {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <div className="h-16 flex items-center justify-end px-6 border-b">Loading...</div>;
  }
  
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b bg-white">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium text-neutral-600">
          Insurance Form Editor
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-sm text-neutral-500">
            Welcome, {user.firstName || user.username}
          </div>
        )}
        <UserButton />
      </div>
    </header>
  );
};

export default AuthHeader;
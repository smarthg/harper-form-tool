import { Link } from "wouter";
import { UserButton } from "@clerk/clerk-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import harperLogo from "../assets/harper-logo.svg";

export function Header() {
  return (
    <header className="border-b shadow-sm bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <img src={harperLogo} alt="HarperInsure Logo" className="h-10" />
            </a>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <a className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </a>
          </Link>
          <Link href="/form-editor">
            <a className="text-sm font-medium transition-colors hover:text-primary">
              Form Editor
            </a>
          </Link>
          <Link href="/about">
            <a className="text-sm font-medium transition-colors hover:text-primary">
              About
            </a>
          </Link>
          <div className="ml-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-6">
                <Link href="/">
                  <a className="text-sm font-medium transition-colors hover:text-primary">
                    Dashboard
                  </a>
                </Link>
                <Link href="/form-editor">
                  <a className="text-sm font-medium transition-colors hover:text-primary">
                    Form Editor
                  </a>
                </Link>
                <Link href="/about">
                  <a className="text-sm font-medium transition-colors hover:text-primary">
                    About
                  </a>
                </Link>
                <div className="pt-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default Header;
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Loader } from "@/components/ui/loader";
import { logout } from "@/lib/slices/authSlice";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use the global auth state instead of local state.
  const user = useSelector((state: { auth: { user: any } }) => state.auth.user);
  const isLoggedIn = Boolean(user);

  // Reset loading state when the route changes
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const handleLinkClick = () => {
    setLoading(true);
  };

  // Handle logout by dispatching the logout action and then redirecting.
  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  // Base routes always visible.
  const routes = [
    // { href: "/", label: "Home" },
    { href: "/find", label: "Find Missing" },
    { href: "/report", label: "Report Missing" },
    { href: "/alerts", label: "Alerts" },
  ];

  // Add the dashboard route if the user is logged in.
  if (isLoggedIn) {
    routes.push({ href: "/dashboard", label: "Dashboard" });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-primary shadow-md">
      <div className="container px-4 mx-auto flex h-16 items-center relative">
        {/* Mobile Logo - Always visible */}
        <div className="flex md:hidden items-center">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-5 w-5 text-primary-foreground" />
            <span className="text-lg font-bold text-primary-foreground">ABSENS</span>
          </Link>
        </div>

        {/* Mobile Navigation using a Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden mr-auto ml-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground h-8 w-8 p-0 hover:bg-primary/80">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-card text-card-foreground border-r border-border w-[250px] sm:w-[300px]"
          >
            <Link
              href="/"
              onClick={() => {
                setOpen(false);
                handleLinkClick();
              }}
              className="flex items-center space-x-2 mb-8"
            >
              <AlertTriangle className="h-6 w-6 text-foreground" />
              <span className="text-xl font-bold text-foreground">ABSENS</span>
            </Link>
            <nav className="flex flex-col gap-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => {
                    setOpen(false);
                    handleLinkClick();
                  }}
                  className={`text-lg font-medium transition-colors hover:text-foreground ${
                    pathname === route.href ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center flex-1">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="mr-6 flex items-center space-x-2"
          >
            <AlertTriangle className="h-6 w-6 text-primary-foreground" />
            <span className="text-xl font-bold text-primary-foreground">ABSENS</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={handleLinkClick}
                className={`transition-colors hover:text-primary-foreground ${
                  pathname === route.href ? "text-primary-foreground" : "text-primary-foreground/80"
                }`}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Register or Logout button, plus ModeToggle */}
        <div className="flex items-center ml-auto space-x-2">
          {isLoggedIn ? (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
              asChild
            >
              <Link href="/signup" onClick={handleLinkClick}>
                Register
              </Link>
            </Button>
          )}
          <ModeToggle />
        </div>

        {/* Loader overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
            <Loader size="lg" overlay={true} />
          </div>
        )}
      </div>
    </header>
  );
}

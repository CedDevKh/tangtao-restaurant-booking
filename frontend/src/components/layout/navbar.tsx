"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, UtensilsCrossed, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic nav links based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", label: "Home" },
      { href: "/restaurants", label: "Restaurants" },
      { href: "/bookings", label: "My Bookings" },
      { href: "/recommendations", label: "AI Picks" },
    ];

    if (user?.is_staff) {
      baseLinks.push({ href: "/admin/dashboard", label: "Admin" });
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial) || user.username?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'User';
  };

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
        href={href}
        className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === href ? "text-primary" : "text-foreground/80"
        )}
    >
        {label}
    </Link>
  );

  const MobileNavLink = ({ href, label }: { href: string; label: string }) => (
     <SheetClose asChild>
        <Link
            href={href}
            className={cn(
                "block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === href ? "bg-accent text-accent-foreground" : "text-foreground/80"
            )}
        >
            {label}
        </Link>
     </SheetClose>
  );


  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://i.pravatar.cc/150" alt="User avatar" />
            <AvatarFallback>
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserDisplayName(user)}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'No email'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href="/bookings">My Bookings</Link>
        </DropdownMenuItem>
        {user?.is_staff && (
          <DropdownMenuItem asChild>
              <Link href="/admin/dashboard">Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold">Tangtao</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map(link => <NavLink key={link.href} {...link} />)}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="hidden md:block">
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/auth/login">Log In</Link>
                </Button>
                <Button asChild>
                    <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <div className="flex flex-col h-full">
                    <div className="border-b pb-4">
                        <Link href="/" className="flex items-center gap-2">
                            <UtensilsCrossed className="h-6 w-6 text-primary" />
                            <span className="font-headline text-xl font-bold">Tangtao</span>
                        </Link>
                    </div>
                    <nav className="flex flex-col gap-4 py-4">
                        {navLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                    </nav>
                    <div className="mt-auto border-t pt-4">
                        {isLoggedIn ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src="https://i.pravatar.cc/150" alt="User avatar" />
                                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{getUserDisplayName(user)}</p>
                                        <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary">View Profile</Link>
                                    </div>
                                </div>
                                {user?.is_staff && (
                                    <SheetClose asChild>
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href="/admin/dashboard">Admin Dashboard</Link>
                                        </Button>
                                    </SheetClose>
                                )}
                                <SheetClose asChild>
                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Log Out'}
                                    </Button>
                                </SheetClose>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <SheetClose asChild>
                                    <Button variant="outline" asChild>
                                        <Link href="/auth/login">Log In</Link>
                                    </Button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Button asChild>
                                        <Link href="/auth/register">Sign Up</Link>
                                    </Button>
                                </SheetClose>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

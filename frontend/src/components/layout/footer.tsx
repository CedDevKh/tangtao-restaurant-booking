import Link from "next/link";
import { UtensilsCrossed, Twitter, Facebook, Instagram } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t bg-card hidden sm:block", className)}>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div>
                 <Link href="/" className="flex items-center gap-2">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                    <span className="font-headline text-2xl font-bold">Tangtao</span>
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                    Your guide to the best dining deals in town. Book, enjoy, and save.
                </p>
                <div className="mt-6 flex gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Twitter className="h-5 w-5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Facebook className="h-5 w-5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Instagram className="h-5 w-5" /></Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:col-span-2 sm:grid-cols-3">
                <div>
                    <p className="font-semibold text-foreground">Company</p>
                    <nav className="mt-4 flex flex-col space-y-2 text-sm">
                        <Link href="#" className="text-muted-foreground hover:text-primary">About Us</Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">Careers</Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">Press</Link>
                    </nav>
                </div>
                 <div>
                    <p className="font-semibold text-foreground">For Foodies</p>
                    <nav className="mt-4 flex flex-col space-y-2 text-sm">
                        <Link href="/restaurants" className="text-muted-foreground hover:text-primary">Restaurants</Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">Gift Cards</Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">Blog</Link>
                    </nav>
                </div>
                 <div>
                    <p className="font-semibold text-foreground">Legal</p>
                    <nav className="mt-4 flex flex-col space-y-2 text-sm">
                        <Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary">Cookie Policy</Link>
                    </nav>
                </div>
            </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Tangtao. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

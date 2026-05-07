import { Link, useLocation } from "wouter";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300 ease-in-out h-16 sm:h-20 flex items-center px-6 md:px-12",
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm" : "bg-gradient-to-b from-background/80 to-transparent"
      )}
    >
      <div className="flex items-center w-full max-w-screen-2xl mx-auto">
        <Link href="/" className="mr-8">
          <span className="text-2xl font-black tracking-tighter text-primary">
            STREAM<span className="text-white">VAULT</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 font-medium text-sm text-white/70">
          <Link href="/" className={cn("hover:text-white transition-colors", location === "/" && "text-white font-bold")}>
            Home
          </Link>
          <Link href="/browse/movies" className={cn("hover:text-white transition-colors", location === "/browse/movies" && "text-white font-bold")}>
            Movies
          </Link>
          <Link href="/browse/tv" className={cn("hover:text-white transition-colors", location === "/browse/tv" && "text-white font-bold")}>
            TV Shows
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/search"
            className="p-2 text-white/70 hover:text-white transition-colors hover:bg-white/10 rounded-full"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

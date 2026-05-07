import { Link } from "wouter";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@workspace/api-client-react";

export function HeroBanner({ item }: { item: MediaItem }) {
  if (!item) return null;

  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
    : "";
  
  const isMovie = item.media_type === "movie" || !!item.title;
  const title = item.title || item.name;
  const link = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] flex items-end pb-24 group">
      <div className="absolute inset-0 z-0">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover animate-in fade-in duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      <div className="relative z-10 px-6 md:px-12 max-w-4xl animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4 line-clamp-2">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-white/80 line-clamp-3 mb-8 max-w-2xl font-medium leading-relaxed">
          {item.overview}
        </p>
        <div className="flex items-center gap-4">
          <Link href={link} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-md font-semibold text-lg transition-colors">
            <Play className="w-5 h-5 fill-current" />
            Watch Now
          </Link>
          <Link href={link} className="flex items-center justify-center gap-2 bg-secondary/80 backdrop-blur text-secondary-foreground hover:bg-secondary h-12 px-8 rounded-md font-semibold text-lg transition-colors">
            <Info className="w-5 h-5" />
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
}

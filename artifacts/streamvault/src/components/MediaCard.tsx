import { Link } from "wouter";
import { Star } from "lucide-react";
import { MediaItem } from "@workspace/api-client-react";

export function MediaCard({ item }: { item: MediaItem }) {
  const isMovie = item.media_type === "movie" || !!item.title;
  const link = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;
  const title = item.title || item.name;
  
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : null;

  return (
    <Link href={link} className="group relative block aspect-[2/3] w-[160px] sm:w-[200px] md:w-[240px] shrink-0 overflow-hidden rounded-lg bg-muted transition-transform duration-300 hover:scale-105 hover:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4 text-center">
          <span className="text-muted-foreground font-medium">{title}</span>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold leading-tight mb-2 line-clamp-2">
          {title}
        </h3>
        {item.vote_average ? (
          <div className="flex items-center gap-1.5 text-primary">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold text-sm">{item.vote_average.toFixed(1)}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

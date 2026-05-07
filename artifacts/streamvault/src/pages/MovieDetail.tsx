import { useParams } from "wouter";
import { useGetMovie } from "@workspace/api-client-react";
import { Navigation } from "@/components/Navigation";
import { MediaRow } from "@/components/MediaRow";
import { Play, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";

export function MovieDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: movie, isLoading } = useGetMovie(id);
  const [isPlaying, setIsPlaying] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="w-full h-[60vh] bg-muted animate-pulse" />
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      {isPlaying ? (
        <div className="w-full pt-20 bg-black aspect-video max-h-[85vh]">
          <iframe
            src={`https://www.vidking.net/embed/movie/${movie.id}`}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="relative w-full min-h-[60vh] flex items-end pt-32 pb-16">
          <div className="absolute inset-0 z-0">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt={movie.title}
                className="w-full h-full object-cover opacity-30"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="relative z-10 px-6 md:px-12 w-full max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-8 items-end md:items-start">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-48 md:w-64 rounded-xl shadow-2xl shrink-0 hidden md:block"
              />
            )}
            
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-xl text-primary font-medium italic">
                    {movie.tagline}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/70">
                {movie.vote_average ? (
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-white text-base">{movie.vote_average.toFixed(1)}</span>
                  </div>
                ) : null}
                
                {movie.release_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(movie.release_date), "yyyy")}</span>
                  </div>
                )}
                
                {movie.runtime ? (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{movie.runtime} min</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 ml-2">
                  {movie.genres?.map(g => (
                    <span key={g.id} className="px-2.5 py-1 bg-white/10 rounded-md text-xs font-semibold text-white">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-lg text-white/80 leading-relaxed max-w-3xl">
                {movie.overview}
              </p>

              <Button size="lg" className="h-14 px-8 text-lg font-bold gap-3" onClick={() => setIsPlaying(true)}>
                <Play className="w-6 h-6 fill-current" />
                Watch Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto mt-12 px-6 md:px-12 space-y-16">
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-white">Cast</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
              {movie.credits.cast.slice(0, 15).map(person => (
                <div key={person.id} className="w-[120px] shrink-0 text-center">
                  <div className="aspect-[2/3] rounded-lg bg-muted overflow-hidden mb-3">
                    {person.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <span className="text-secondary-foreground/50 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">{person.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.similar?.results && movie.similar.results.length > 0 && (
          <div className="-mx-6 md:-mx-12">
            <MediaRow title="Similar Movies" items={movie.similar.results} />
          </div>
        )}
      </div>
    </div>
  );
}

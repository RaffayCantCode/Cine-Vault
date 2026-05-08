import { useState } from "react";
import { useDiscoverTv, useGetTvGenres, getDiscoverTvQueryKey } from "@workspace/api-client-react";
import { Navigation } from "@/components/Navigation";
import { MediaCard } from "@/components/MediaCard";
import { cn } from "@/lib/utils";

export function BrowseTv() {
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  
  const { data: genresData } = useGetTvGenres();
  const genres = genresData?.genres || [];

  const { data: shows, isLoading } = useDiscoverTv(
    { genreId: selectedGenre, sortBy },
    { query: { queryKey: getDiscoverTvQueryKey({ genreId: selectedGenre, sortBy }) } }
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />
      
      <div className="pt-32 px-6 md:px-12 max-w-screen-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">TV Shows</h1>
        
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setSelectedGenre(undefined)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              selectedGenre === undefined 
                ? "bg-primary text-white" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            All Shows
          </button>
          {genres.map(genre => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedGenre === genre.id 
                  ? "bg-primary text-white" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {shows?.results?.map(item => (
              <div key={item.id} className="w-full h-full flex justify-center">
                <MediaCard item={{...item, media_type: "tv"}} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

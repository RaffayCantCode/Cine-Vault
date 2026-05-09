"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MediaCard } from "@/components/MediaCard";
import { cn, fetchJson } from "@/lib/utils";

interface Genre {
  id: number;
  name: string;
}

interface TvShow {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export default function BrowseTvPage() {
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [shows, setShows] = useState<TvShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      setError(null);
      try {
        const data = await fetchJson<{ genres: Genre[] }>("/api/tmdb/genres/tv");
        setGenres(data.genres || []);
      } catch (error) {
        setGenres([]);
        setError(error instanceof Error ? error.message : "Failed to fetch genres");
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchShows = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedGenre) params.append("genreId", selectedGenre.toString());
        params.append("sortBy", "popularity.desc");

        const data = await fetchJson<{ results: TvShow[] }>(`/api/tmdb/discover/tv?${params}`);
        setShows(data.results || []);
      } catch (error) {
        setShows([]);
        setError(error instanceof Error ? error.message : "Failed to fetch TV shows");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, [selectedGenre]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      <div className="pt-32 px-6 md:px-12 max-w-screen-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">TV Shows</h1>

        {error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/80 mb-10">
            <div className="text-sm font-semibold text-white mb-1">Couldn&apos;t load TV shows</div>
            <div className="text-xs text-white/50 break-words">{error}</div>
          </div>
        )}

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
          {genres.map((genre) => (
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
            {shows.map((item) => (
              <div key={item.id} className="w-full h-full flex justify-center">
                <MediaCard item={{ ...item, media_type: "tv" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

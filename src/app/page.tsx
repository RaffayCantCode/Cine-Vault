"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HeroBanner } from "@/components/HeroBanner";
import { MediaRow } from "@/components/MediaRow";
import { ContinueWatching } from "@/components/ContinueWatching";
import { fetchJson } from "@/lib/utils";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

interface ApiResponse {
  results: MediaItem[];
}

export default function Home() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [popularTv, setPopularTv] = useState<MediaItem[]>([]);
  const [topRatedTv, setTopRatedTv] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [
          trendingData,
          popularMoviesData,
          topRatedMoviesData,
          popularTvData,
          topRatedTvData,
        ] = await Promise.all([
          fetchJson<ApiResponse>("/api/tmdb/trending?type=all&timeWindow=week"),
          fetchJson<ApiResponse>("/api/tmdb/movies/popular"),
          fetchJson<ApiResponse>("/api/tmdb/movies/top-rated"),
          fetchJson<ApiResponse>("/api/tmdb/tv/popular"),
          fetchJson<ApiResponse>("/api/tmdb/tv/top-rated"),
        ]);

        setTrending(trendingData.results || []);
        setPopularMovies(popularMoviesData.results || []);
        setTopRatedMovies(topRatedMoviesData.results || []);
        setPopularTv(popularTvData.results || []);
        setTopRatedTv(topRatedTvData.results || []);
      } catch (error) {
        setTrending([]);
        setPopularMovies([]);
        setTopRatedMovies([]);
        setPopularTv([]);
        setTopRatedTv([]);
        setError(error instanceof Error ? error.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroItem = trending[0];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      {isLoading ? (
        <div className="w-full h-[70vh] md:h-[85vh] bg-muted animate-pulse" />
      ) : error ? (
        <div className="pt-32 px-6 md:px-12 max-w-screen-2xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/80">
            <div className="text-lg font-bold text-white mb-1">Couldn&apos;t load content</div>
            <div className="text-sm text-white/50 break-words">{error}</div>
          </div>
        </div>
      ) : heroItem ? (
        <HeroBanner item={heroItem} />
      ) : null}

      <div className="relative z-20 mt-6 md:mt-10 space-y-2 md:space-y-4">
        <ContinueWatching />
        <MediaRow
          title="Trending This Week"
          items={trending.slice(1)}
          isLoading={isLoading}
        />
        <MediaRow
          title="Popular Movies"
          items={popularMovies}
          isLoading={isLoading}
        />
        <MediaRow
          title="Top Rated Movies"
          items={topRatedMovies}
          isLoading={isLoading}
        />
        <MediaRow
          title="Popular TV Shows"
          items={popularTv}
          isLoading={isLoading}
        />
        <MediaRow
          title="Top Rated TV Shows"
          items={topRatedTv}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { HeroBanner } from "@/components/HeroBanner";
import { MediaRow } from "@/components/MediaRow";
import { fetchJson, filterReleasedSafeContent } from "@/lib/utils";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface Genre {
  id: number;
  name: string;
}

const FRANCHISES = [
  "Marvel",
  "DC",
  "Star Wars",
  "Harry Potter",
  "Fast & Furious",
  "Transformers",
  "John Wick",
  "Mission Impossible",
  "Disney",
  "Pixar",
];

export default function Home() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [tr, pm, pt, np, gm] = await Promise.all([
          fetchJson<{ results: MediaItem[] }>("/api/tmdb/trending?type=all&timeWindow=week&page=1", { cacheTtlMs: 120000 }),
          fetchJson<{ results: MediaItem[] }>("/api/tmdb/movies/popular?page=1", { cacheTtlMs: 120000 }),
          fetchJson<{ results: MediaItem[] }>("/api/tmdb/tv/top-rated?page=1", { cacheTtlMs: 120000 }),
          fetchJson<{ results: MediaItem[] }>("/api/tmdb/movies/now-playing?page=1", { cacheTtlMs: 120000 }),
          fetchJson<{ genres: Genre[] }>("/api/tmdb/genres/movies", { cacheTtlMs: 86400000 }),
        ]);

        const trendingSafe = filterReleasedSafeContent(tr.results || []);
        const popularSafe = filterReleasedSafeContent(pm.results || []).map((i) => ({ ...i, media_type: "movie" }));
        const topSafe = filterReleasedSafeContent(pt.results || []).map((i) => ({ ...i, media_type: "tv" }));
        const recentSafe = filterReleasedSafeContent(np.results || []).map((i) => ({ ...i, media_type: "movie" }));

        setTrending(trendingSafe);
        setPopular(popularSafe);
        setTopRated(topSafe);
        setRecent(recentSafe);
        setRecommended([...popularSafe.slice(0, 10), ...topSafe.slice(0, 10)]);
        setGenres((gm.genres || []).slice(0, 18));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const hero = useMemo(() => trending[0] || popular[0], [trending, popular]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Sidebar />
      <main className="md:pl-56 lg:pl-64 pt-0">
        {hero ? <HeroBanner item={hero} /> : <div className="h-[56vh] bg-muted/30 animate-pulse" />}

        <div className="px-5 md:px-10 lg:px-12 max-w-screen-2xl mx-auto py-8 space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Link key={genre.id} href={`/browse/genre/${genre.id}`} className="px-3 py-2 rounded-xl bg-white/[0.06] text-sm text-white/80 hover:bg-white/[0.12] transition">
                  {genre.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Franchise Collections</h2>
            <div className="flex flex-wrap gap-2">
              {FRANCHISES.map((name) => (
                <Link key={name} href={`/search?q=${encodeURIComponent(name)}`} className="px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-sm text-violet-200 hover:bg-violet-600/30 transition">
                  {name}
                </Link>
              ))}
            </div>
          </section>

          <MediaRow title="Famous / Popular" items={popular} isLoading={isLoading} seeAllHref="/browse/movies/popular" />
          <MediaRow title="Top Rated" items={topRated} isLoading={isLoading} seeAllHref="/browse/tv/top-rated" />
          <MediaRow title="Trending Now" items={trending} isLoading={isLoading} seeAllHref="/browse/trending" />
          <MediaRow title="Recently Added" items={recent} isLoading={isLoading} seeAllHref="/browse/movies" />
          <MediaRow title="Recommended" items={recommended} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

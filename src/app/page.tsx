"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { HeroBanner } from "@/components/HeroBanner";
import { MediaRow } from "@/components/MediaRow";
import { Film, Tv, Sparkles, TrendingUp, Star, Clapperboard, ChevronRight, Library, Globe } from "lucide-react";
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
  original_language?: string;
  genre_ids?: number[];
}

interface Genre {
  id: number;
  name: string;
}

const FRANCHISES = [
  "Marvel", "DC", "Star Wars", "Harry Potter",
  "Fast & Furious", "Transformers", "John Wick",
  "Mission Impossible", "Disney", "Pixar",
];

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const portalCards = [
  {
    title: "Cinema",
    subtitle: "Movies",
    description: "Blockbusters, indie darlings, timeless classics — the big screen experience at home.",
    icon: Film,
    href: "/browse/movies",
    gradient: "from-[#111844] via-[#1a2268] to-[#4B5694]",
    borderColor: "border-[#4B5694]/50",
    accentColor: "bg-[#4B5694]",
  },
  {
    title: "Series",
    subtitle: "TV Shows",
    description: "Binge-worthy seasons, gripping dramas, and laugh-out-loud comedies.",
    icon: Tv,
    href: "/browse/tv",
    gradient: "from-[#111844] via-[#1e2a50] to-[#7288AE]",
    borderColor: "border-[#7288AE]/50",
    accentColor: "bg-[#7288AE]",
  },
  {
    title: "Anime",
    subtitle: "JP Dub + Eng Sub",
    description: "Japanese audio, English subtitles — from classics to seasonal hits.",
    icon: Sparkles,
    href: "/anime",
    gradient: "from-[#111844] via-[#2a2244] to-[#EAE0CF]",
    borderColor: "border-[#EAE0CF]/30",
    accentColor: "bg-[#EAE0CF]",
  },
];

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      const rngPage = (max: number) => Math.floor(Math.random() * max) + 1;
      try {
        const [tr, pm, pt, np, gm] = await Promise.all([
          fetchJson<{ results: MediaItem[] }>(
            `/api/tmdb/trending?type=all&timeWindow=week&page=${rngPage(5)}`,
            { cacheTtlMs: 180000 }
          ),
          fetchJson<{ results: MediaItem[] }>(
            `/api/tmdb/movies/popular?page=${rngPage(5)}`,
            { cacheTtlMs: 180000 }
          ),
          fetchJson<{ results: MediaItem[] }>(
            `/api/tmdb/tv/top-rated?page=${rngPage(5)}`,
            { cacheTtlMs: 180000 }
          ),
          fetchJson<{ results: MediaItem[] }>(
            `/api/tmdb/movies/now-playing?page=${rngPage(3)}`,
            { cacheTtlMs: 180000 }
          ),
          fetchJson<{ genres: Genre[] }>(
            "/api/tmdb/genres/movies",
            { cacheTtlMs: 86400000 }
          ),
        ]);

        if (cancelled) return;

        const trendingSafe = filterReleasedSafeContent(tr.results || []);
        const popularSafe = filterReleasedSafeContent(pm.results || []).map(
          (i) => ({ ...i, media_type: "movie" as const })
        );
        const topSafe = filterReleasedSafeContent(pt.results || []).map(
          (i) => ({ ...i, media_type: "tv" as const })
        );
        const recentSafe = filterReleasedSafeContent(np.results || []).map(
          (i) => ({ ...i, media_type: "movie" as const })
        );

        setTrending(shuffleArray(trendingSafe));
        setPopular(shuffleArray(popularSafe));
        setTopRated(shuffleArray(topSafe));
        setRecent(shuffleArray(recentSafe));
        setRecommended(shuffleArray([
          ...popularSafe.slice(0, 10),
          ...topSafe.slice(0, 10),
        ]));
        setGenres((gm.genres || []).slice(0, 18));
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load content"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const heroPool = useMemo(() => {
    const pool = [...trending.slice(0, 5), ...popular.slice(0, 5)];
    const unique: MediaItem[] = [];
    const seen = new Set<number>();
    for (const item of pool) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique.slice(0, 5);
  }, [trending, popular]);

  const hero = heroPool[heroIndex];

  useEffect(() => {
    if (heroPool.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroPool.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroPool]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Sidebar />
      <main className="md:pl-56 lg:pl-64 bleed-header">

        {/* ─── UNIVERSE PORTAL ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#111844]/60 via-[#111844]/20 to-background pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4B5694]/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#7288AE]/5 rounded-full blur-[100px]" />

          <div className="relative px-5 md:px-10 lg:px-12 max-w-screen-2xl mx-auto pt-24 md:pt-28 pb-12 md:pb-16">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-16 mb-10">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-[2px] bg-gradient-to-r from-[#7288AE] to-[#EAE0CF] rounded-full" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#7288AE]">Unlimited</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                  <span className="text-[#EAE0CF]">Movies.</span>
                  <br />
                  <span className="text-[#EAE0CF]">TV.</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#7288AE] to-[#EAE0CF] bg-clip-text text-transparent">Anime.</span>
                </h1>
                <p className="text-[#7288AE] text-base md:text-lg mt-4 font-medium leading-relaxed max-w-md">
                  All in one place. Stream everything you love — curated, premium, and always fresh.
                </p>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#7288AE]/60">
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>10K+ Titles</span>
                  </div>
                  <div className="w-px h-4 bg-[#7288AE]/20" />
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#7288AE]/60">
                    <Star className="w-3.5 h-3.5" />
                    <span>Curated</span>
                  </div>
                  <div className="w-px h-4 bg-[#7288AE]/20" />
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#7288AE]/60">
                    <Globe className="w-3.5 h-3.5" />
                    <span>HD Quality</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-1 text-[#EAE0CF]/30">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className="text-2xl font-black" style={{ opacity: 0.6 - i * 0.15 }}>✦</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {portalCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ borderColor: "rgba(114, 136, 174, 0.15)" }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-80`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.04] to-transparent rounded-bl-full" />

                  <div className="relative p-6 md:p-7">
                    <div className={`w-12 h-12 rounded-xl ${card.accentColor}/20 border ${card.borderColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className={`w-6 h-6 text-[#EAE0CF]`} />
                    </div>

                    <h3 className="text-xl font-black text-[#EAE0CF] mb-0.5">{card.title}</h3>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-[#7288AE]/80 mb-3">{card.subtitle}</p>
                    <p className="text-sm text-[#7288AE]/70 leading-relaxed mb-5 line-clamp-2">{card.description}</p>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#EAE0CF]/80 group-hover:text-[#EAE0CF] transition-colors">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HERO BANNER ─── */}
        {hero ? (
          <HeroBanner key={hero.id} item={hero} />
        ) : (
          !loadError && (
            <div className="h-[50vh] bg-[#111844]/30 animate-pulse" />
          )
        )}

        {loadError && (
          <div className="px-5 md:px-10 lg:px-12 max-w-screen-2xl mx-auto pt-6">
            <div className="rounded-2xl border border-[#7288AE]/20 bg-[#4B5694]/10 p-4 text-sm text-[#7288AE]">
              {loadError}
            </div>
          </div>
        )}

        <div className="px-5 md:px-10 lg:px-12 max-w-screen-2xl mx-auto py-12 space-y-12">

          {/* ─── GENRE UNIVERSE ─── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-to-r from-[#7288AE] to-transparent rounded-full" />
              <div>
                <h2 className="text-lg font-black text-[#EAE0CF] tracking-tight">Genre Universe</h2>
                <p className="text-[9px] text-[#7288AE]/50 font-semibold tracking-[0.15em] uppercase">Browse by category</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {genres.slice(0, 12).map((genre) => (
                <Link
                  key={genre.id}
                  href={`/browse/genre/${genre.id}`}
                  className="group relative overflow-hidden rounded-xl border border-[#7288AE]/10 bg-gradient-to-br from-[#111844]/80 to-[#1a2268]/40 p-4 hover:border-[#7288AE]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#4B5694]/10"
                >
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#4B5694]/10 rounded-full blur-xl group-hover:bg-[#7288AE]/20 transition-all" />
                  <span className="text-sm font-bold text-[#EAE0CF]/80 group-hover:text-[#EAE0CF] transition-colors">{genre.name}</span>
                </Link>
              ))}
              <Link
                href="/browse/movies"
                className="group relative overflow-hidden rounded-xl border border-[#4B5694]/20 bg-[#4B5694]/10 p-4 flex items-center justify-center gap-2 hover:bg-[#4B5694]/20 transition-all"
              >
                <span className="text-xs font-bold text-[#7288AE]">View All</span>
                <ChevronRight className="w-3 h-3 text-[#7288AE]" />
              </Link>
            </div>
          </section>

          {/* ─── CONTENT ROWS ─── */}
          <section className="relative">
            <MediaRow
              title="Popular Now"
              items={popular}
              isLoading={isLoading}
              seeAllHref="/browse/movies/popular"
            />
          </section>

          <MediaRow
            title="Top Rated"
            items={topRated}
            isLoading={isLoading}
            seeAllHref="/browse/tv/top-rated"
          />

          <MediaRow
            title="Trending Now"
            items={trending}
            isLoading={isLoading}
            seeAllHref="/browse/trending"
          />

          {/* ─── FRANCHISE UNIVERSE ─── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-to-r from-[#7288AE] to-transparent rounded-full" />
              <div>
                <h2 className="text-lg font-black text-[#EAE0CF] tracking-tight">Franchise Universe</h2>
                <p className="text-[9px] text-[#7288AE]/50 font-semibold tracking-[0.15em] uppercase">Curated collections</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {FRANCHISES.map((name) => (
                <Link
                  key={name}
                  href={`/browse/franchise/${encodeURIComponent(name)}`}
                  className="group relative overflow-hidden rounded-xl border border-[#7288AE]/10 bg-gradient-to-br from-[#111844]/80 to-[#1a2268]/30 p-4 hover:border-[#7288AE]/25 hover:shadow-lg hover:shadow-[#4B5694]/10 transition-all duration-300"
                >
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#7288AE]/5 rounded-full blur-2xl group-hover:bg-[#4B5694]/10 transition-all" />
                  <span className="text-sm font-bold text-[#EAE0CF]/70 group-hover:text-[#EAE0CF] transition-colors">{name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ─── ANIME SPOTLIGHT ─── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-gradient-to-r from-[#7288AE] to-transparent rounded-full" />
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-black text-[#EAE0CF] tracking-tight">Anime Universe</h2>
                  <p className="text-[9px] text-[#7288AE]/50 font-semibold tracking-[0.15em] uppercase">Japanese audio with English subtitles</p>
                </div>
                <Link
                  href="/anime"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#4B5694] to-[#7288AE] text-[#EAE0CF] text-xs font-bold hover:shadow-lg hover:shadow-[#4B5694]/30 transition-all flex items-center gap-2"
                >
                  Browse Anime <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </section>

          <MediaRow
            title="Recently Added"
            items={recent}
            isLoading={isLoading}
            seeAllHref="/browse/movies"
          />

          <MediaRow
            title="Recommended For You"
            items={recommended}
            isLoading={isLoading}
          />

          {/* ─── FOOTER TAG ─── */}
          <footer className="border-t border-[#7288AE]/10 pt-8 pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src="/logo-icon.svg" alt="CineVault" className="w-6 h-6 opacity-50" />
              <span className="text-sm font-bold tracking-wider text-[#7288AE]/40">
                CINE<span className="text-[#EAE0CF]/40">VAULT</span>
              </span>
            </div>
            <p className="text-[10px] text-[#7288AE]/30 font-medium tracking-wider">
              Movies. TV. Anime. All in one place.
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}

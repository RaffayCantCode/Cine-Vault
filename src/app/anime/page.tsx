"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AnimeCard, AnimeItem } from "@/components/AnimeCard";
import { fetchJson, shuffleArray } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AnimeBrowsePage() {
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"spotlight" | "latest" | "popular">("spotlight");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchJson<{
          success: boolean;
          data: {
            spotlightAnimes?: AnimeItem[];
            latestEpisodeAnimes?: AnimeItem[];
            newReleases?: AnimeItem[];
          };
        }>("/api/anime?category=home");

        if (data.success && data.data) {
          const all = [
            ...(data.data.spotlightAnimes || []),
            ...(data.data.latestEpisodeAnimes || []),
            ...(data.data.newReleases || []),
          ];
          // Deduplicate by id
          const seen = new Set<string>();
          const deduped = all.filter((a) => {
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
          });
          setAnimes(shuffleArray(deduped));
        } else {
          throw new Error("Anime API returned no data");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load anime");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Sidebar />

      <main className="md:pl-16 lg:pl-20">
      <div className="pt-32 px-6 md:px-12 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-violet-500 rounded-full" />
            <h1 className="text-4xl font-bold text-white">Anime</h1>
            <span className="text-xs font-bold tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full uppercase">
              🇯🇵 Japanese Dub · English Subtitles
            </span>
          </div>
          <p className="text-sm text-white/40 mt-1 ml-5">
            All anime here are in Japanese audio with English subtitles. Different from English-dubbed shows.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          {(["spotlight", "latest", "popular"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
                activeTab === tab
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white"
              }`}
            >
              {tab === "spotlight" ? "✨ Spotlight" : tab === "latest" ? "🆕 Latest" : "🔥 Popular"}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/80 mb-10">
            <div className="text-lg font-bold text-white mb-1">Couldn&apos;t load anime</div>
            <div className="text-sm text-white/50 break-words">{error}</div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : animes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          >
            {animes.map((item, i) => (
              <div key={item.id} className="w-full h-full flex justify-center">
                <AnimeCard item={item} index={i} />
              </div>
            ))}
          </motion.div>
        ) : (
          !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <div className="text-6xl mb-4">🍥</div>
              <h3 className="text-xl font-medium text-white mb-2">No anime found</h3>
              <p>The anime library couldn&apos;t be loaded right now. Try again later.</p>
            </div>
          )
        )}
      </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MediaCard } from "@/components/MediaCard";
import { fetchJson } from "@/lib/utils";

type TrendType = "movie" | "tv";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface TrendState {
  items: MediaItem[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: TrendState = {
  items: [],
  page: 1,
  hasMore: true,
  isLoading: false,
  error: null,
};

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<TrendType>("movie");
  const [timeWindow, setTimeWindow] = useState<"day" | "week">("week");
  const [state, setState] = useState<Record<TrendType, TrendState>>({ movie: initialState, tv: initialState });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const current = state[activeTab];

  const loadPage = async (tab: TrendType, page: number, append: boolean) => {
    setState((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        isLoading: true,
        error: null,
      },
    }));

    try {
      const data = await fetchJson<{ results: MediaItem[]; page: number; total_pages: number }>(
        `/api/tmdb/trending?type=${tab}&timeWindow=${timeWindow}&page=${page}`,
        { cacheTtlMs: 120000 }
      );

      setState((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          isLoading: false,
          items: append ? [...prev[tab].items, ...(data.results || [])] : data.results || [],
          page,
          hasMore: data.page < data.total_pages,
        },
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          isLoading: false,
          error: e instanceof Error ? e.message : "Failed to load trending content",
          hasMore: false,
        },
      }));
    }
  };

  useEffect(() => {
    loadPage(activeTab, 1, false);
  }, [activeTab, timeWindow]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (current.isLoading || !current.hasMore) return;
        loadPage(activeTab, current.page + 1, true);
      },
      { rootMargin: "300px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, current.isLoading, current.hasMore, current.page, timeWindow]);

  const title = useMemo(() => (activeTab === "movie" ? "Trending Movies" : "Trending TV Shows"), [activeTab]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Sidebar />
      <main className="md:pl-56 lg:pl-64 pt-0">
        <div className="px-6 md:px-12 max-w-screen-2xl mx-auto">
          <div className="mb-8 flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Trending</h1>
              <p className="text-sm text-white/40 mt-2">{title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab("movie")} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === "movie" ? "bg-violet-600 text-white" : "bg-white/[0.05] text-white/60"}`}>Movies</button>
              <button onClick={() => setActiveTab("tv")} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === "tv" ? "bg-violet-600 text-white" : "bg-white/[0.05] text-white/60"}`}>TV Shows</button>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value as "day" | "week")}
                className="h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white/80 text-sm font-semibold"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>

          {current.error && <div className="mb-6 text-sm text-red-300">{current.error}</div>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {current.items.map((item, idx) => (
              <div key={`${activeTab}-${item.id}-${idx}`} className="w-full h-full flex justify-center">
                <MediaCard item={{ ...item, media_type: activeTab }} index={idx} />
              </div>
            ))}
            {current.isLoading && current.items.length === 0 && Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="aspect-[2/3] rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>

          <div ref={sentinelRef} className="h-20 flex items-center justify-center text-white/50 text-sm">
            {current.isLoading && current.items.length > 0 ? "Loading more..." : current.hasMore ? "Scroll for more" : "End of results"}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useDiscoverMovies, useGetMovieGenres, getDiscoverMoviesQueryKey } from "@workspace/api-client-react";
import { Navigation } from "@/components/Navigation";
import { MediaCard } from "@/components/MediaCard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "release_date.desc", label: "Newest" },
  { value: "revenue.desc", label: "Highest Grossing" },
];

export function BrowseMovies() {
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  const [page, setPage] = useState(1);

  const { data: genresData } = useGetMovieGenres();
  const genres = genresData?.genres || [];

  const { data: movies, isLoading } = useDiscoverMovies(
    { genreId: selectedGenre, sortBy, page },
    { query: { queryKey: getDiscoverMoviesQueryKey({ genreId: selectedGenre, sortBy, page }) } }
  );

  const totalPages = Math.min(movies?.total_pages ?? 1, 500);

  const handleGenre = (g: number | undefined) => { setSelectedGenre(g); setPage(1); };
  const handleSort = (s: string) => { setSortBy(s); setPage(1); };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const goPage = (p: number) => { setPage(p); scrollTop(); };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      <div className="pt-28 px-5 md:px-10 max-w-screen-2xl mx-auto">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-widest">Movies</h1>
        </div>

        {/* Sort + Genre filters */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSort(opt.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                  sortBy === opt.value
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white/8 text-white/60 hover:bg-white/14 hover:text-white border border-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleGenre(undefined)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                selectedGenre === undefined
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white/8 text-white/60 hover:bg-white/14 hover:text-white border border-white/10"
              )}
            >
              All Genres
            </button>
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => handleGenre(genre.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                  selectedGenre === genre.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-white/8 text-white/60 hover:bg-white/14 hover:text-white border border-white/10"
                )}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            >
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] w-full rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`page-${page}-${selectedGenre}-${sortBy}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            >
              {movies?.results?.map(item => (
                <MediaCard key={item.id} item={{ ...item, media_type: "movie" }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/80 hover:border-primary/40 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200",
                      p === page
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-white/8 text-white/60 hover:bg-white/14 hover:text-white border border-white/10"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/80 hover:border-primary/40 transition-all duration-200"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <p className="text-center text-white/30 text-xs mt-4">
            Page {page} of {totalPages.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

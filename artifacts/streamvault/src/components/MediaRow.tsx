import { useRef, useState, useEffect } from "react";
import { MediaCard } from "./MediaCard";
import { MediaItem } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface MediaRowProps {
  title: string;
  items?: MediaItem[];
  isLoading?: boolean;
  seeAllHref?: string;
  mediaType?: "movie" | "tv";
}

export function MediaRow({ title, items, isLoading, seeAllHref, mediaType }: MediaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH = 222;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [items]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -CARD_WIDTH * 3 : CARD_WIDTH * 3, behavior: "smooth" });
  };

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-4 md:py-6 space-y-3 group/row"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="w-[3px] h-5 bg-primary rounded-full" />
          <h2 className="text-base md:text-lg font-bold text-white tracking-wide">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {seeAllHref && (
            <a
              href={seeAllHref}
              className="flex items-center gap-0.5 text-xs font-semibold text-white/40 hover:text-primary transition-colors group"
            >
              See all
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
          {/* Arrow buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/80 hover:border-primary/40 hover:scale-105 active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/80 hover:border-primary/40 hover:scale-105 active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll row */}
      <div className="relative">
        {/* Left fade */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-4 w-16 z-10 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to right, var(--color-background), transparent)",
            opacity: canScrollLeft ? 1 : 0,
          }}
        />
        {/* Right fade */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 z-10 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to left, var(--color-background), transparent)",
            opacity: canScrollRight ? 1 : 0,
          }}
        />

        <div
          ref={scrollRef}
          className="w-full overflow-x-auto pb-4 pt-2 hide-scrollbar"
        >
          <div className="flex gap-3 md:gap-4 px-5 md:px-10 w-max">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[2/3] w-[150px] sm:w-[180px] md:w-[210px] shrink-0 rounded-xl bg-muted/40"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))
              : items?.map((item, i) => (
                  <MediaCard
                    key={item.id}
                    item={mediaType ? { ...item, media_type: mediaType } : item}
                    index={i}
                  />
                ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaItem } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroCarouselProps {
  items: MediaItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex(i => (i + 1) % items.length);
    }, 6000);
  }, [items.length]);

  useEffect(() => {
    startAutoplay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoplay]);

  const goTo = (i: number) => { setActiveIndex(i); startAutoplay(); };
  const prev = () => { setActiveIndex(i => (i - 1 + items.length) % items.length); startAutoplay(); };
  const next = () => { setActiveIndex(i => (i + 1) % items.length); startAutoplay(); };

  if (!items.length) return null;

  const getItem = (offset: number) => items[(activeIndex + offset + items.length) % items.length];

  const current = getItem(0);
  const isMovie = current.media_type === "movie" || !!current.title;
  const title = current.title || current.name || "";
  const year = (current.release_date || current.first_air_date || "").slice(0, 4);
  const watchLink = isMovie ? `/watch/movie/${current.id}` : `/watch/tv/${current.id}/1/1`;
  const detailLink = isMovie ? `/movie/${current.id}` : `/tv/${current.id}`;

  const slots: { offset: number; x: number; scale: number; rotateY: number; opacity: number; z: number }[] = [
    { offset: -2, x: -580, scale: 0.52, rotateY: 18, opacity: 0.25, z: 1 },
    { offset: -1, x: -310, scale: 0.72, rotateY: 12, opacity: 0.6,  z: 2 },
    { offset:  0, x:    0, scale: 1.00, rotateY:  0, opacity: 1.0,  z: 5 },
    { offset:  1, x:  310, scale: 0.72, rotateY:-12, opacity: 0.6,  z: 2 },
    { offset:  2, x:  580, scale: 0.52, rotateY:-18, opacity: 0.25, z: 1 },
  ];

  return (
    <div className="relative w-full overflow-hidden bg-background" style={{ height: "88vh", minHeight: 560 }}>
      {/* Blurred backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {current.backdrop_path && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${current.backdrop_path}`}
              alt=""
              className="w-full h-full object-cover object-top scale-110"
              style={{ filter: "blur(8px) brightness(0.22)" }}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20 z-1" />

      {/* Cards stage */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ perspective: "1400px" }}>
        {slots.map(({ offset, x, scale, rotateY, opacity, z }) => {
          const item = getItem(offset);
          const isCenter = offset === 0;
          const posterUrl = item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null;

          return (
            <motion.div
              key={`slot-${offset}`}
              className="absolute"
              animate={{ x, scale, rotateY, opacity, zIndex: z }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ transformStyle: "preserve-3d", zIndex: z }}
              onClick={() => !isCenter && goTo((activeIndex + offset + items.length) % items.length)}
            >
              <div
                className={`relative overflow-hidden rounded-2xl shadow-2xl transition-all ${
                  !isCenter ? "cursor-pointer" : ""
                }`}
                style={{
                  width: isCenter ? 270 : Math.abs(offset) === 1 ? 195 : 155,
                  aspectRatio: "2/3",
                  boxShadow: isCenter
                    ? "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)"
                    : "0 16px 48px rgba(0,0,0,0.7)",
                }}
              >
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center p-4 text-center">
                    <span className="text-muted-foreground text-xs">{item.title || item.name}</span>
                  </div>
                )}

                {/* Hover tint for side cards */}
                {!isCenter && (
                  <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors duration-300" />
                )}

                {/* Center card info overlay */}
                {isCenter && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-5">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-[0.18em]">
                        {isMovie ? "Movie" : "Series"}
                      </span>
                      {current.vote_average ? (
                        <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          {current.vote_average.toFixed(1)}
                        </span>
                      ) : null}
                      {year && <span className="text-white/40 text-xs font-medium">{year}</span>}
                    </div>

                    <h2 className="font-display text-[2.2rem] leading-none text-white tracking-widest mb-1 drop-shadow-lg">
                      {title}
                    </h2>

                    <div className="flex gap-2 mt-3">
                      <a
                        href={watchLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary/80 active:scale-95 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-lg shadow-primary/30 transition-all duration-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Watch
                      </a>
                      <Link
                        href={detailLink}
                        className="flex items-center gap-1.5 bg-white/12 hover:bg-white/20 active:scale-95 border border-white/12 text-white font-semibold px-4 py-2 rounded-lg text-xs backdrop-blur-sm transition-all duration-200"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Info
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/55 border border-white/12 flex items-center justify-center text-white hover:bg-primary/80 hover:border-primary/40 transition-all duration-200 backdrop-blur-sm"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/55 border border-white/12 flex items-center justify-center text-white hover:bg-primary/80 hover:border-primary/40 transition-all duration-200 backdrop-blur-sm"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Description + dots */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center pb-7 gap-3 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-white/45 text-sm text-center max-w-md px-8 line-clamp-2 font-medium"
          >
            {current.overview}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-1.5 pointer-events-auto">
          {items.slice(0, Math.min(items.length, 12)).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "bg-primary w-5" : "bg-white/25 w-1.5 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

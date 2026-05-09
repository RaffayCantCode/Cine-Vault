"use client";

import Link from "next/link";
import { Star, Play } from "lucide-react";
import { motion } from "framer-motion";

export interface AnimeItem {
  id: string;
  name: string;
  jname?: string | null;
  poster: string;
  type?: string | null;
  episodes?: { sub: number | null; dub: number | null };
  rating?: string | null;
  description?: string;
  genres?: string[];
}

interface AnimeCardProps {
  item: AnimeItem;
  index?: number;
}

export function AnimeCard({ item, index = 0 }: AnimeCardProps) {
  const subCount = item.episodes?.sub ?? null;
  const dubCount = item.episodes?.dub ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
    >
      <Link
        href={`/anime/${item.id}`}
        className="group relative block aspect-[2/3] w-[150px] sm:w-[180px] md:w-[210px] shrink-0 overflow-hidden rounded-xl bg-muted transition-all duration-300 hover:scale-[1.06] hover:z-10 focus:outline-none"
        style={{ transformOrigin: "center bottom" }}
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center bg-card">
            <span className="text-muted-foreground text-xs font-medium">{item.name}</span>
          </div>
        )}

        {/* JP DUB Badge — always visible top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
          <span className="bg-violet-600/90 backdrop-blur-sm text-white text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-md uppercase leading-none">
            🇯🇵 JP SUB
          </span>
          {dubCount !== null && dubCount > 0 && (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-md uppercase leading-none">
              DUB
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3.5">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-violet-500/40 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-white font-bold text-sm leading-tight mb-0.5 line-clamp-2">
              {item.name}
            </h3>
            {item.jname && (
              <p className="text-white/40 text-[10px] leading-tight mb-1 line-clamp-1">{item.jname}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {item.type && (
                <span className="text-violet-400 text-[9px] font-bold uppercase tracking-wider">
                  {item.type}
                </span>
              )}
              {subCount !== null && (
                <span className="flex items-center gap-0.5 text-white/40 text-[9px]">
                  <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                  {subCount} eps
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

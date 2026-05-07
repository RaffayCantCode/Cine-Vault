import { ReactNode } from "react";
import { MediaCard } from "./MediaCard";
import { MediaItem } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaRowProps {
  title: string;
  items?: MediaItem[];
  isLoading?: boolean;
}

export function MediaRow({ title, items, isLoading }: MediaRowProps) {
  if (!isLoading && (!items || items.length === 0)) {
    return null;
  }

  return (
    <div className="py-6 md:py-8 space-y-4">
      <h2 className="text-xl md:text-2xl font-bold px-6 md:px-12 text-white">{title}</h2>
      
      <div className="w-full overflow-x-auto pb-6 pt-2 hide-scrollbar">
        <div className="flex gap-4 md:gap-6 px-6 md:px-12 w-max">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] w-[160px] sm:w-[200px] md:w-[240px] shrink-0 rounded-lg bg-muted/50" />
              ))
            : items?.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
        </div>
      </div>
    </div>
  );
}

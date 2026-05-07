import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useGetTvShow, useGetTvSeason, getGetTvSeasonQueryKey } from "@workspace/api-client-react";
import { Navigation } from "@/components/Navigation";
import { MediaRow } from "@/components/MediaRow";
import { Play, Star, Calendar, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function TvDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: show, isLoading: showLoading } = useGetTvShow(id);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [playingEpisode, setPlayingEpisode] = useState<{ season: number, episode: number } | null>(null);

  const { data: seasonData, isLoading: seasonLoading } = useGetTvSeason(id, selectedSeason, {
    query: { enabled: !!id && !!selectedSeason, queryKey: getGetTvSeasonQueryKey(id, selectedSeason) }
  });

  useEffect(() => {
    if (show && !playingEpisode) {
      // Find lowest available season
      const lowestSeason = show.seasons?.find(s => s.season_number > 0)?.season_number || 1;
      setSelectedSeason(lowestSeason);
    }
  }, [show, playingEpisode]);

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="w-full h-[60vh] bg-muted animate-pulse" />
      </div>
    );
  }

  if (!show) return null;

  const backdropUrl = show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null;
  const posterUrl = show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : null;
  
  const seasons = show.seasons?.filter(s => s.season_number > 0) || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      {playingEpisode ? (
        <div className="w-full pt-20 bg-black aspect-video max-h-[85vh]">
          <iframe
            src={`https://www.vidking.net/embed/tv/${show.id}/${playingEpisode.season}/${playingEpisode.episode}`}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="relative w-full min-h-[60vh] flex items-end pt-32 pb-16">
          <div className="absolute inset-0 z-0">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt={show.name}
                className="w-full h-full object-cover opacity-30"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="relative z-10 px-6 md:px-12 w-full max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-8 items-end md:items-start">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={show.name}
                className="w-48 md:w-64 rounded-xl shadow-2xl shrink-0 hidden md:block"
              />
            )}
            
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2">
                  {show.name}
                </h1>
                {show.tagline && (
                  <p className="text-xl text-primary font-medium italic">
                    {show.tagline}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/70">
                {show.vote_average ? (
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="text-white text-base">{show.vote_average.toFixed(1)}</span>
                  </div>
                ) : null}
                
                {show.first_air_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(show.first_air_date), "yyyy")}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 ml-2">
                  {show.genres?.map(g => (
                    <span key={g.id} className="px-2.5 py-1 bg-white/10 rounded-md text-xs font-semibold text-white">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-lg text-white/80 leading-relaxed max-w-3xl">
                {show.overview}
              </p>
              
              <Button size="lg" className="h-14 px-8 text-lg font-bold gap-3" onClick={() => {
                if (seasonData?.episodes?.[0]) {
                  setPlayingEpisode({ season: selectedSeason, episode: seasonData.episodes[0].episode_number });
                }
              }}>
                <Play className="w-6 h-6 fill-current" />
                Watch S{selectedSeason} E1
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto mt-12 px-6 md:px-12 space-y-16">
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Episodes</h2>
            {seasons.length > 0 && (
              <Select value={selectedSeason.toString()} onValueChange={v => setSelectedSeason(Number(v))}>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-secondary">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {seasons.map(s => (
                    <SelectItem key={s.id} value={s.season_number.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {seasonLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl bg-muted/50" />)
            ) : seasonData?.episodes?.map(episode => (
              <div 
                key={episode.id} 
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-all duration-300 group cursor-pointer",
                  playingEpisode?.season === selectedSeason && playingEpisode?.episode === episode.episode_number
                    ? "bg-primary/10 border-primary" 
                    : "bg-secondary/30 border-transparent hover:bg-secondary/60 hover:border-secondary"
                )}
                onClick={() => setPlayingEpisode({ season: selectedSeason, episode: episode.episode_number })}
              >
                <div className="w-32 md:w-48 shrink-0 aspect-video rounded-md overflow-hidden bg-muted relative">
                  {episode.still_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                      alt={episode.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-white text-base truncate pr-4">
                      {episode.episode_number}. {episode.name}
                    </h4>
                    {episode.runtime ? (
                      <span className="text-xs text-muted-foreground shrink-0">{episode.runtime}m</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {episode.overview || "No description available."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {show.credits?.cast && show.credits.cast.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 text-white">Cast</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
              {show.credits.cast.slice(0, 15).map(person => (
                <div key={person.id} className="w-[120px] shrink-0 text-center">
                  <div className="aspect-[2/3] rounded-lg bg-muted overflow-hidden mb-3">
                    {person.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <span className="text-secondary-foreground/50 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">{person.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {show.similar?.results && show.similar.results.length > 0 && (
          <div className="-mx-6 md:-mx-12">
            <MediaRow title="Similar Shows" items={show.similar.results} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  useGetTrending,
  useGetPopularMovies,
  useGetTopRatedMovies,
  useGetPopularTv,
  useGetTopRatedTv,
  useDiscoverMovies,
  useDiscoverTv,
  getDiscoverMoviesQueryKey,
  getDiscoverTvQueryKey,
} from "@workspace/api-client-react";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MediaRow } from "@/components/MediaRow";
import { Navigation } from "@/components/Navigation";
import { ContinueWatching } from "@/components/ContinueWatching";

// Randomize which page to pull from so content feels fresh on every visit
const randPage = (max = 5) => Math.floor(Math.random() * max) + 1;

const [popMoviePage] = [randPage(4)];
const [topMoviePage] = [randPage(4)];
const [popTvPage]    = [randPage(4)];
const [topTvPage]    = [randPage(4)];
const [actionPage]   = [randPage(3)];
const [crimePage]    = [randPage(3)];
const [scifiPage]    = [randPage(3)];
const [horrorPage]   = [randPage(2)];
const [comedyPage]   = [randPage(3)];

// TMDB genre IDs
const GENRE = {
  action: 28,
  crime: 80,
  scifi: 878,
  horror: 27,
  comedy: 35,
  thriller: 53,
  scifiTv: 10765,
  crimeTv: 80,
  animeTv: 16,
};

export function Home() {
  const { data: trending, isLoading: trendingLoading } = useGetTrending({ type: "all", timeWindow: "week" });

  const { data: popularMovies,  isLoading: l1 } = useGetPopularMovies({ page: popMoviePage });
  const { data: topRatedMovies, isLoading: l2 } = useGetTopRatedMovies({ page: topMoviePage });
  const { data: popularTv,      isLoading: l3 } = useGetPopularTv({ page: popTvPage });
  const { data: topRatedTv,     isLoading: l4 } = useGetTopRatedTv({ page: topTvPage });

  const { data: actionMovies,   isLoading: l5 } = useDiscoverMovies(
    { genreId: GENRE.action, sortBy: "popularity.desc", page: actionPage },
    { query: { queryKey: getDiscoverMoviesQueryKey({ genreId: GENRE.action, sortBy: "popularity.desc", page: actionPage }) } }
  );
  const { data: horrorMovies,   isLoading: l6 } = useDiscoverMovies(
    { genreId: GENRE.horror, sortBy: "vote_average.desc", page: horrorPage },
    { query: { queryKey: getDiscoverMoviesQueryKey({ genreId: GENRE.horror, sortBy: "vote_average.desc", page: horrorPage }) } }
  );
  const { data: scifiMovies,    isLoading: l7 } = useDiscoverMovies(
    { genreId: GENRE.scifi, sortBy: "popularity.desc", page: scifiPage },
    { query: { queryKey: getDiscoverMoviesQueryKey({ genreId: GENRE.scifi, sortBy: "popularity.desc", page: scifiPage }) } }
  );
  const { data: crimeTV,        isLoading: l8 } = useDiscoverTv(
    { genreId: GENRE.crimeTv, sortBy: "popularity.desc", page: crimePage },
    { query: { queryKey: getDiscoverTvQueryKey({ genreId: GENRE.crimeTv, sortBy: "popularity.desc", page: crimePage }) } }
  );
  const { data: scifiTV,        isLoading: l9 } = useDiscoverTv(
    { genreId: GENRE.scifiTv, sortBy: "popularity.desc", page: scifiPage },
    { query: { queryKey: getDiscoverTvQueryKey({ genreId: GENRE.scifiTv, sortBy: "popularity.desc", page: scifiPage }) } }
  );
  const { data: comedyMovies,   isLoading: l10 } = useDiscoverMovies(
    { genreId: GENRE.comedy, sortBy: "popularity.desc", page: comedyPage },
    { query: { queryKey: getDiscoverMoviesQueryKey({ genreId: GENRE.comedy, sortBy: "popularity.desc", page: comedyPage }) } }
  );
  const { data: animeTV,        isLoading: l11 } = useDiscoverTv(
    { genreId: GENRE.animeTv, sortBy: "popularity.desc", page: 1 },
    { query: { queryKey: getDiscoverTvQueryKey({ genreId: GENRE.animeTv, sortBy: "popularity.desc", page: 1 }) } }
  );
  const { data: hiddenGems,     isLoading: l12 } = useDiscoverMovies(
    { genreId: undefined, sortBy: "vote_average.desc", page: randPage(8) + 3 },
    { query: { queryKey: getDiscoverMoviesQueryKey({ genreId: undefined, sortBy: "vote_average.desc", page: 6 }) } }
  );

  const heroItems = trending?.results?.slice(0, 12) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      {/* Hero Carousel */}
      {trendingLoading ? (
        <div className="w-full bg-muted animate-pulse" style={{ height: "88vh", minHeight: 560 }} />
      ) : heroItems.length > 0 ? (
        <HeroCarousel items={heroItems} />
      ) : null}

      {/* Content rows */}
      <div className="relative z-20 mt-4 md:mt-6 space-y-1 md:space-y-2">
        <ContinueWatching />

        <MediaRow
          title="Trending This Week"
          items={trending?.results?.slice(0, 20)}
          isLoading={trendingLoading}
        />
        <MediaRow
          title="Popular Movies"
          items={popularMovies?.results}
          isLoading={l1}
          mediaType="movie"
          seeAllHref="/browse/movies"
        />
        <MediaRow
          title="Action &amp; Thrills"
          items={actionMovies?.results}
          isLoading={l5}
          mediaType="movie"
        />
        <MediaRow
          title="Binge-Worthy TV"
          items={popularTv?.results}
          isLoading={l3}
          mediaType="tv"
          seeAllHref="/browse/tv"
        />
        <MediaRow
          title="Sci-Fi &amp; Fantasy"
          items={scifiMovies?.results}
          isLoading={l7}
          mediaType="movie"
        />
        <MediaRow
          title="Crime &amp; Suspense"
          items={crimeTV?.results}
          isLoading={l8}
          mediaType="tv"
        />
        <MediaRow
          title="Top Rated Movies"
          items={topRatedMovies?.results}
          isLoading={l2}
          mediaType="movie"
          seeAllHref="/browse/movies"
        />
        <MediaRow
          title="Horror Picks"
          items={horrorMovies?.results}
          isLoading={l6}
          mediaType="movie"
        />
        <MediaRow
          title="Sci-Fi TV"
          items={scifiTV?.results}
          isLoading={l9}
          mediaType="tv"
        />
        <MediaRow
          title="Laugh Out Loud"
          items={comedyMovies?.results}
          isLoading={l10}
          mediaType="movie"
        />
        <MediaRow
          title="Top Rated TV Shows"
          items={topRatedTv?.results}
          isLoading={l4}
          mediaType="tv"
          seeAllHref="/browse/tv"
        />
        <MediaRow
          title="Anime"
          items={animeTV?.results}
          isLoading={l11}
          mediaType="tv"
        />
        <MediaRow
          title="Hidden Gems"
          items={hiddenGems?.results}
          isLoading={l12}
          mediaType="movie"
        />
      </div>
    </div>
  );
}

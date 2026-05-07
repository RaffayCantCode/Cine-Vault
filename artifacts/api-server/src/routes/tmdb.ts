import { Router, type IRouter } from "express";
import { tmdbFetch } from "../lib/tmdb";
import {
  GetTrendingQueryParams,
  SearchContentQueryParams,
  GetMovieParams,
  GetTvShowParams,
  GetTvSeasonParams,
  GetPopularMoviesQueryParams,
  GetTopRatedMoviesQueryParams,
  GetPopularTvQueryParams,
  GetTopRatedTvQueryParams,
  DiscoverMoviesQueryParams,
  DiscoverTvQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trending", async (req, res): Promise<void> => {
  const parsed = GetTrendingQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { type = "all", timeWindow = "week", page = 1 } = parsed.data;
  const data = await tmdbFetch(`/trending/${type}/${timeWindow}`, { page: String(page) });
  res.json(data);
});

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchContentQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { query, type = "multi", page = 1 } = parsed.data;
  const data = await tmdbFetch(`/search/${type}`, { query, page: String(page) });
  res.json(data);
});

router.get("/movie/:id", async (req, res): Promise<void> => {
  const parsed = GetMovieParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = await tmdbFetch(`/movie/${parsed.data.id}`, {
    append_to_response: "credits,videos,similar",
  });
  res.json(data);
});

router.get("/tv/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularTvQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1 } = parsed.data;
  const data = await tmdbFetch("/tv/popular", { page: String(page) });
  res.json(data);
});

router.get("/tv/top-rated", async (req, res): Promise<void> => {
  const parsed = GetTopRatedTvQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1 } = parsed.data;
  const data = await tmdbFetch("/tv/top_rated", { page: String(page) });
  res.json(data);
});

router.get("/tv/:id/season/:seasonNumber", async (req, res): Promise<void> => {
  const parsed = GetTvSeasonParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = await tmdbFetch(`/tv/${parsed.data.id}/season/${parsed.data.seasonNumber}`);
  res.json(data);
});

router.get("/tv/:id", async (req, res): Promise<void> => {
  const parsed = GetTvShowParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = await tmdbFetch(`/tv/${parsed.data.id}`, {
    append_to_response: "credits,videos,similar",
  });
  res.json(data);
});

router.get("/movies/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1 } = parsed.data;
  const data = await tmdbFetch("/movie/popular", { page: String(page) });
  res.json(data);
});

router.get("/movies/top-rated", async (req, res): Promise<void> => {
  const parsed = GetTopRatedMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1 } = parsed.data;
  const data = await tmdbFetch("/movie/top_rated", { page: String(page) });
  res.json(data);
});

router.get("/genres/movies", async (_req, res): Promise<void> => {
  const data = await tmdbFetch("/genre/movie/list");
  res.json(data);
});

router.get("/genres/tv", async (_req, res): Promise<void> => {
  const data = await tmdbFetch("/genre/tv/list");
  res.json(data);
});

router.get("/discover/movies", async (req, res): Promise<void> => {
  const parsed = DiscoverMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { genreId, sortBy = "popularity.desc", page = 1 } = parsed.data;
  const params: Record<string, string> = { sort_by: sortBy, page: String(page) };
  if (genreId) params.with_genres = String(genreId);
  const data = await tmdbFetch("/discover/movie", params);
  res.json(data);
});

router.get("/discover/tv", async (req, res): Promise<void> => {
  const parsed = DiscoverTvQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { genreId, sortBy = "popularity.desc", page = 1 } = parsed.data;
  const params: Record<string, string> = { sort_by: sortBy, page: String(page) };
  if (genreId) params.with_genres = String(genreId);
  const data = await tmdbFetch("/discover/tv", params);
  res.json(data);
});

export default router;

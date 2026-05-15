import { NextRequest } from "next/server";
import { fetchAnimeApi } from "@/lib/anime-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "home";
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    let data: any;

    if (category === "home" || category === "spotlight" || category === "popular") {
      data = await fetchAnimeApi(`/popular?page=${page}`);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
        hasMore: true,
      });
    } else if (category === "new-releases" || category === "latest") {
      data = await fetchAnimeApi(`/recently-added?page=${page}`);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
        hasMore: true,
      });
    } else if (category === "search") {
      const query = searchParams.get("q") || "";
      data = await fetchAnimeApi(`/search?q=${encodeURIComponent(query)}&page=${page}`);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: [],
          latestEpisodeAnimes: animes.slice(0, 9),
          newReleases: animes.slice(9, 18),
        },
        hasMore: animes.length >= 9,
      });
    } else {
      data = await fetchAnimeApi(`/popular?page=${page}`);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
        hasMore: true,
      });
    }
  } catch (error) {
    console.error("[Anime API Route Error]:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
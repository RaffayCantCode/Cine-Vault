import { NextRequest } from "next/server";
import * as Jikan from "@/lib/jikan-fetch";
import { fetchAnimeApi } from "@/lib/anime-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "home";

  try {
    let data: any;

    if (category === "home" || category === "spotlight") {
      // Get top anime and currently airing from Jikan
      const [topData, airingData] = await Promise.all([
        Jikan.getTopAnime(1, 12),
        Jikan.getCurrentlyAiring(1, 12),
      ]);

      const topAnimes = topData.data || [];
      const airingAnimes = airingData.data || [];

      // Shuffle for variety
      const shuffled = [...topAnimes, ...airingAnimes].sort(() => Math.random() - 0.5);
      const uniqueMap = new Map();
      shuffled.forEach((a: any) => uniqueMap.set(a.id, a));
      const uniqueAnimes = Array.from(uniqueMap.values());

      return Response.json({
        success: true,
        data: {
          spotlightAnimes: uniqueAnimes.slice(0, 6),
          latestEpisodeAnimes: uniqueAnimes.slice(6, 12),
          newReleases: uniqueAnimes.slice(12, 18),
        },
      });
    } else if (category === "new-releases" || category === "latest") {
      // Currently airing anime
      data = await Jikan.getCurrentlyAiring(1, 18);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
      });
    } else if (category === "popular") {
      // Top anime
      data = await Jikan.getTopAnime(1, 18);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
      });
    } else if (category === "recent") {
      // Recent season anime
      data = await Jikan.getRecentAnime(1, 18);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
      });
    } else if (category === "search") {
      const query = searchParams.get("q") || "";
      data = await Jikan.searchAnime(query, 1, 18);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: [],
          latestEpisodeAnimes: animes.slice(0, 9),
          newReleases: animes.slice(9, 18),
        },
      });
    } else {
      // Default: top anime
      data = await Jikan.getTopAnime(1, 18);
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
      });
    }
  } catch (error) {
    console.error("[Anime API Route Error]:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
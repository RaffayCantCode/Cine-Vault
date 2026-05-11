import { NextRequest } from "next/server";
import * as AniPub from "@/lib/anime-fetch-new";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "home";
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    let data: any;

    if (category === "home" || category === "spotlight" || category === "popular") {
      data = await AniPub.getTopAnime();
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
      });
    } else if (category === "new-releases" || category === "latest") {
      data = await AniPub.getTopAnime();
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
      data = await AniPub.searchAnime(query);
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
      data = await AniPub.getTopAnime();
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
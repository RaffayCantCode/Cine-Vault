import { NextRequest } from "next/server";
import { fetchAnimeApi } from "@/lib/anime-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "home";

  try {
    let data: any;

    if (category === "home" || category === "spotlight") {
      data = await fetchAnimeApi("/home", { next: { revalidate: 300 } });
    } else if (category === "new-releases" || category === "latest") {
      data = await fetchAnimeApi("/api/search?keyword=2024", { next: { revalidate: 300 } });
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
      data = await fetchAnimeApi("/api/search?keyword=popular", { next: { revalidate: 300 } });
      const animes = data.data || [];
      return Response.json({
        success: true,
        data: {
          spotlightAnimes: animes.slice(0, 6),
          latestEpisodeAnimes: animes.slice(6, 12),
          newReleases: animes.slice(12, 18),
        },
      });
    } else {
      data = await fetchAnimeApi("/api/search?keyword=a", { next: { revalidate: 300 } });
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
    return Response.json(data);
  } catch (error) {
    console.error("[Anime API Route Error]:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
